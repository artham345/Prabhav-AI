import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.db import get_db
from backend.app.models import User, InfluencerProfile, SocialPlatformData
from backend.app.schemas import InfluencerProfileCreate, InfluencerProfileUpdate, InfluencerProfileResponse, SocialDataSchema
from backend.app.routers.auth import get_current_active_influencer, get_current_user
from backend.app.services.profile_intelligence import analyze_creator_posts

router = APIRouter(prefix="/influencer", tags=["Influencer Profile & Intelligence"])

def format_influencer_response(profile: InfluencerProfile) -> dict:
    """Helper to convert db model strings to lists/dicts for Pydantic validation."""
    socials = []
    for data in profile.social_data:
        socials.append({
            "platform": data.platform,
            "followers_count": data.followers_count,
            "engagement_rate": data.engagement_rate,
            "primary_country": data.primary_country,
            "age_groups": json.loads(data.age_groups or "{}"),
            "gender_ratio": json.loads(data.gender_ratio or "{}"),
            "interests": json.loads(data.interests or "[]"),
            "growth_trends": json.loads(data.growth_trends or "[]"),
            "content_categories": json.loads(data.content_categories or "{}")
        })
        
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "bio": profile.bio,
        "instagram_handle": profile.instagram_handle,
        "youtube_handle": profile.youtube_handle,
        "linkedin_handle": profile.linkedin_handle,
        "twitter_handle": profile.twitter_handle,
        "creator_category": profile.creator_category,
        "niches": json.loads(profile.niches or "[]"),
        "expected_charge": profile.expected_charge,
        "portfolio_urls": json.loads(profile.portfolio_urls or "[]"),
        "previous_brands": json.loads(profile.previous_brands or "[]"),
        "trust_score": profile.trust_score,
        "created_at": profile.created_at,
        "social_data": socials
    }

@router.post("/profile", response_model=InfluencerProfileResponse, status_code=status.HTTP_201_CREATED)
def create_influencer_profile(
    profile_in: InfluencerProfileCreate,
    current_user: User = Depends(get_current_active_influencer),
    db: Session = Depends(get_db)
):
    # Check if profile exists
    existing = db.query(InfluencerProfile).filter(InfluencerProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Influencer profile already exists. Use PUT to update."
        )
        
    profile = InfluencerProfile(
        user_id=current_user.id,
        full_name=profile_in.full_name,
        bio=profile_in.bio,
        instagram_handle=profile_in.instagram_handle,
        youtube_handle=profile_in.youtube_handle,
        linkedin_handle=profile_in.linkedin_handle,
        twitter_handle=profile_in.twitter_handle,
        creator_category=profile_in.creator_category,
        niches=json.dumps(profile_in.niches),
        expected_charge=profile_in.expected_charge,
        portfolio_urls=json.dumps(profile_in.portfolio_urls),
        previous_brands=json.dumps(profile_in.previous_brands),
        trust_score=7.8 # Base default
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return format_influencer_response(profile)

@router.get("/profile", response_model=InfluencerProfileResponse)
def get_influencer_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve by user_id
    profile = db.query(InfluencerProfile).filter(InfluencerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Influencer profile not found."
        )
    return format_influencer_response(profile)

@router.put("/profile", response_model=InfluencerProfileResponse)
def update_influencer_profile(
    profile_in: InfluencerProfileUpdate,
    current_user: User = Depends(get_current_active_influencer),
    db: Session = Depends(get_db)
):
    profile = db.query(InfluencerProfile).filter(InfluencerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Influencer profile not found."
        )
        
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ["niches", "portfolio_urls", "previous_brands"]:
            setattr(profile, field, json.dumps(value))
        else:
            setattr(profile, field, value)
            
    db.commit()
    db.refresh(profile)
    return format_influencer_response(profile)

# GET ALL INFLUENCERS FOR DISCOVERY HUB (PUBLIC/AUTHENTICATED BRANDS)
@router.get("/all", response_model=list[InfluencerProfileResponse])
def get_all_influencers(
    db: Session = Depends(get_db)
):
    influencers = db.query(InfluencerProfile).all()
    return [format_influencer_response(inf) for inf in influencers]

@router.post("/intelligence/ingest", response_model=InfluencerProfileResponse)
def ingest_social_profile_intelligence(
    current_user: User = Depends(get_current_active_influencer),
    db: Session = Depends(get_db)
):
    """
    Simulates multi-platform scraping (Instagram, YouTube, LinkedIn, X, Website),
    converts simulated contents into SBERT embeddings, uses Zero-Shot Classification
    to identify dominant content niches, and updates local analytics records.
    """
    profile = db.query(InfluencerProfile).filter(InfluencerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create a profile first."
        )
        
    # Clear existing social data
    db.query(SocialPlatformData).filter(SocialPlatformData.influencer_profile_id == profile.id).delete()
    
    # Pre-defined mock posts depending on category to simulate realistic ingestion
    category = profile.creator_category.lower()
    
    if "tech" in category or "code" in category or "software" in category:
        posts_instagram = [
            "Setting up my clean setup with triple monitors! 💻 Rate my setup 1-10.",
            "My morning routine as a software engineer in tech. #coding #coffee"
        ]
        posts_youtube = [
            "Building a Full Stack SaaS in 24 Hours with FastAPI and React. Complete walkthrough tutorial.",
            "Why Python is still the king of AI development in 2026. Deep dive."
        ]
        posts_linkedin = [
            "Today I want to talk about system architecture. Scaling from 10k to 1m users requires strategic database caching and vertical splitting.",
            "Thrilled to join Prabhav AI as a tech advisory creator! Excited for the future of SaaS influencer networks."
        ]
        posts_twitter = [
            "Just pushed a hotfix to production. Nothing beats that feeling. 🛠️",
            "ChatGPT vs Claude vs Gemini. Which LLM are you using for writing code?"
        ]
        interests = ["tech", "coding", "software engineering", "gadgets", "artificial intelligence"]
        niche_tags = ["Technology", "Business & Entrepreneurship"]
        followers_base = 45000
    elif "fitness" in category or "gym" in category or "health" in category:
        posts_instagram = [
            "Leg day motivation! Don't skip squat day. 🏋️‍♂️💪 #gymmotivation",
            "Healthy meal prep for the week: high protein, low carb lunches."
        ]
        posts_youtube = [
            "My 12-Week Transformation Journey: Gym workout and Diet Routine.",
            "Are pre-workout supplements worth it? Science-based review."
        ]
        posts_linkedin = [
            "Developing healthy habits in executive leadership. A strong mind starts with a healthy body.",
            "Reflecting on consistency. What sports taught me about entrepreneurship."
        ]
        posts_twitter = [
            "Early morning run done. 10km under 50 minutes. Let's conquer the day!",
            "Protein shake recipe: oats, banana, peanut butter, whey. Simple."
        ]
        interests = ["fitness", "gym", "nutrition", "healthy lifestyle", "weight lifting"]
        niche_tags = ["Fitness", "Nutrition", "Lifestyle"]
        followers_base = 120000
    else: # Fashion, Lifestyle, Finance, Business or Travel
        posts_instagram = [
            "Aesthetic coffee run and OOTD. Loving this weather! ☕️🧣",
            "Checking out the hidden streets of Paris. Truly magical. #travel"
        ]
        posts_youtube = [
            "Pack with me for a 5-day trip to Paris! Styling minimal outfits.",
            "Day in my life: hosting a fashion brand launch event."
        ]
        posts_linkedin = [
            "Networking at the international fashion forum. Collaborating with brands requires transparent communication.",
            "Creative direction is all about storytelling. Honored to showcase this campaign."
        ]
        posts_twitter = [
            "Paris has my heart. The architecture is just beautiful.",
            "Currently drinking coffee and plotting my next adventure. ✈️"
        ]
        interests = ["lifestyle", "fashion", "travel", "beauty", "vlog"]
        niche_tags = ["Lifestyle", "Travel & Adventure", "Fashion & Beauty"]
        followers_base = 85000
        
    platforms = [
        {"name": "Instagram", "handle": profile.instagram_handle, "posts": posts_instagram, "er": 4.2, "fol_pct": 0.5, "country": "US"},
        {"name": "YouTube", "handle": profile.youtube_handle, "posts": posts_youtube, "er": 2.8, "fol_pct": 0.3, "country": "US"},
        {"name": "LinkedIn", "handle": profile.linkedin_handle, "posts": posts_linkedin, "er": 5.1, "fol_pct": 0.1, "country": "US"},
        {"name": "Twitter", "handle": profile.twitter_handle, "posts": posts_twitter, "er": 1.9, "fol_pct": 0.1, "country": "IN"}
    ]
    
    # Process each platform
    for plat in platforms:
        handle = plat["handle"] or f"@{profile.full_name.lower().replace(' ', '_')}_{plat['name'].lower()}"
        
        # Run SBERT + zero-shot aggregation on posts

        res = analyze_creator_posts(plat["posts"])
        
        # Simulated audience data
        age_groups = {"18-24": 0.40, "25-34": 0.35, "35-44": 0.15, "45+": 0.10}
        gender_ratio = {"male": 0.48, "female": 0.52}
        growth_trends = [
            {"month": "Mar", "followers": int(followers_base * plat["fol_pct"] * 0.9)},
            {"month": "Apr", "followers": int(followers_base * plat["fol_pct"] * 0.95)},
            {"month": "May", "followers": int(followers_base * plat["fol_pct"])}
        ]
        
        sp_data = SocialPlatformData(
            influencer_profile_id=profile.id,
            platform=plat["name"],
            followers_count=int(followers_base * plat["fol_pct"]),
            engagement_rate=plat["er"],
            primary_country=plat["country"],
            age_groups=json.dumps(age_groups),
            gender_ratio=json.dumps(gender_ratio),
            interests=json.dumps(interests),
            growth_trends=json.dumps(growth_trends),
            content_embeddings=json.dumps(res["mean_embedding"]),
            content_categories=json.dumps(res["dominant_niches"])
        )
        db.add(sp_data)
        
    # Calculate a composite trust score out of 10
    # Factors: Has portfolio (+1.0), linked multiple accounts (+1.5), has brand experience (+1.5), base trust 6.0
    portfolio_cnt = len(json.loads(profile.portfolio_urls or "[]"))
    brands_cnt = len(json.loads(profile.previous_brands or "[]"))
    
    active_socials = sum([1 for p in platforms if p["handle"]])
    
    trust_score = 5.5 + (0.5 * min(portfolio_cnt, 3)) + (0.5 * min(brands_cnt, 3)) + (0.5 * active_socials)
    profile.trust_score = round(min(10.0, trust_score), 1)
    
    # Update niches list based on intelligence findings
    profile.niches = json.dumps(niche_tags)
    
    db.commit()
    db.refresh(profile)
    return format_influencer_response(profile)
