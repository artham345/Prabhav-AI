import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.db import get_db
from backend.app.models import User, Campaign, BrandProfile, InfluencerProfile, CampaignSimulation
from backend.app.schemas import (
    CampaignCreate, CampaignResponse, InfluencerRecommendation, 
    BrandFitReport, CampaignSimulationCreate, CampaignSimulationResponse,
    ROIPredictionResponse, SentimentAnalysisResponse, CampaignAdvisorResponse
)
from backend.app.routers.auth import get_current_user, get_current_active_brand
from backend.app.services.recommendation import recommend_influencers
from backend.app.services.brand_fit import analyze_audience_brand_fit
from backend.app.services.simulation import run_campaign_simulation
from backend.app.services.sentiment import analyze_comments_sentiment
from backend.app.services.advisor import get_campaign_advice

router = APIRouter(prefix="/campaigns", tags=["Campaigns & AI Engines"])

@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    campaign_in: CampaignCreate,
    current_user: User = Depends(get_current_active_brand),
    db: Session = Depends(get_db)
):
    brand = db.query(BrandProfile).filter(BrandProfile.user_id == current_user.id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand profile must be created before starting a campaign."
        )
        
    campaign = Campaign(
        brand_profile_id=brand.id,
        product_name=campaign_in.product_name,
        product_category=campaign_in.product_category,
        product_description=campaign_in.product_description,
        budget=campaign_in.budget,
        campaign_goal=campaign_in.campaign_goal,
        target_audience=campaign_in.target_audience,
        campaign_duration_days=campaign_in.campaign_duration_days,
        target_location=campaign_in.target_location,
        preferred_platform=campaign_in.preferred_platform,
        status="active" # automatically set to active for demonstration
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign

@router.get("", response_model=list[CampaignResponse])
def get_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If brand, get brand campaigns; if influencer, return all active campaigns to apply to
    if current_user.role == "brand":
        brand = db.query(BrandProfile).filter(BrandProfile.user_id == current_user.id).first()
        if not brand:
            return []
        return db.query(Campaign).filter(Campaign.brand_profile_id == brand.id).all()
    else:
        return db.query(Campaign).filter(Campaign.status == "active").all()

@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign_by_id(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

# AI FEATURE 1: INFLUENCER RECOMMENDATION ENGINE
@router.get("/{campaign_id}/recommendations", response_model=list[InfluencerRecommendation])
def get_campaign_influencer_recommendations(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    influencers = db.query(InfluencerProfile).all()
    recs = recommend_influencers(campaign, influencers)
    return recs

# AI FEATURE 2: AUDIENCE-BRAND FIT ANALYZER
@router.get("/{campaign_id}/audience-fit/{influencer_id}", response_model=BrandFitReport)
def get_audience_brand_fit(
    campaign_id: str,
    influencer_id: str,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    influencer = db.query(InfluencerProfile).filter(InfluencerProfile.id == influencer_id).first()
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer not found")
        
    report = analyze_audience_brand_fit(campaign, influencer)
    return report

# AI FEATURE 3 & 4: CAMPAIGN SIMULATOR & ROI PREDICTION ENGINE (XGBOOST)
@router.post("/{campaign_id}/simulate", response_model=CampaignSimulationResponse)
def run_simulation(
    campaign_id: str,
    sim_in: CampaignSimulationCreate,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    influencers = db.query(InfluencerProfile).filter(InfluencerProfile.id.in_(sim_in.influencer_ids)).all()
    
    # Run XGBoost predictor simulation
    sim_metrics = run_campaign_simulation(sim_in.budget, influencers)
    
    simulation = CampaignSimulation(
        campaign_id=campaign_id,
        scenario_name=sim_in.scenario_name,
        budget=sim_in.budget,
        influencer_ids=json.dumps(sim_in.influencer_ids),
        expected_reach=sim_metrics["expected_reach"],
        expected_engagement=sim_metrics["expected_engagement"],
        expected_conversions=sim_metrics["expected_conversions"],
        expected_revenue=sim_metrics["expected_revenue"],
        expected_roi=sim_metrics["expected_roi"]
    )
    db.add(simulation)
    db.commit()
    db.refresh(simulation)
    return simulation

# ROI Prediction Standalone Endpoint
@router.get("/{campaign_id}/roi-predictions", response_model=ROIPredictionResponse)
def get_roi_predictions(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Get all recommended influencers to simulate full campaign performance
    influencers = db.query(InfluencerProfile).all()
    # Calculate simulation based on full campaign budget
    sim = run_campaign_simulation(campaign.budget, influencers[:2])
    
    return {
        "expected_revenue": sim["expected_revenue"],
        "expected_roi": sim["expected_roi"],
        "cost_per_conversion": sim["cost_per_conversion"],
        "profitability_score": sim["profitability_score"],
        "roi_score": sim["roi_score"]
    }

# AI FEATURE 5: AUDIENCE SENTIMENT ANALYSIS MODULE (RoBERTa)
@router.post("/{campaign_id}/sentiment", response_model=SentimentAnalysisResponse)
def analyze_campaign_comments_sentiment(
    campaign_id: str,
    comments_in: list[str],
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    res = analyze_comments_sentiment(comments_in)
    return res

# AI FEATURE 6: AI CAMPAIGN ADVISOR (GEMINI API)
@router.get("/{campaign_id}/advisor", response_model=CampaignAdvisorResponse)
def get_ai_campaign_advisor(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Gather recommendation rankings to feed to Gemini
    influencers = db.query(InfluencerProfile).all()
    recs = recommend_influencers(campaign, influencers)
    
    advice = get_campaign_advice(campaign, recs)
    return advice
