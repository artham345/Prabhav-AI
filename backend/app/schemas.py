from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str = Field(..., description="Role must be either 'brand' or 'influencer'")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- PROFILE SCHEMAS ---
class BrandProfileCreate(BaseModel):
    company_name: str
    industry: str
    website: Optional[str] = None
    location: str
    gst_number: Optional[str] = None
    business_reg_number: Optional[str] = None
    budget_range_min: float
    budget_range_max: float
    marketing_goals: List[str] = []
    target_markets: List[str] = []

class BrandProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    gst_number: Optional[str] = None
    business_reg_number: Optional[str] = None
    budget_range_min: Optional[float] = None
    budget_range_max: Optional[float] = None
    marketing_goals: Optional[List[str]] = None
    target_markets: Optional[List[str]] = None

class BrandProfileResponse(BaseModel):
    id: str
    user_id: str
    company_name: str
    industry: str
    website: Optional[str] = None
    location: str
    gst_number: Optional[str] = None
    business_reg_number: Optional[str] = None
    budget_range_min: float
    budget_range_max: float
    marketing_goals: List[str] = []
    target_markets: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

class InfluencerProfileCreate(BaseModel):
    full_name: str
    bio: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_handle: Optional[str] = None
    linkedin_handle: Optional[str] = None
    twitter_handle: Optional[str] = None
    creator_category: str
    niches: List[str] = []
    expected_charge: float
    portfolio_urls: List[str] = []
    previous_brands: List[str] = []

class InfluencerProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_handle: Optional[str] = None
    linkedin_handle: Optional[str] = None
    twitter_handle: Optional[str] = None
    creator_category: Optional[str] = None
    niches: Optional[List[str]] = None
    expected_charge: Optional[float] = None
    portfolio_urls: Optional[List[str]] = None
    previous_brands: Optional[List[str]] = None

# Platform Data
class SocialDataSchema(BaseModel):
    platform: str
    followers_count: int
    engagement_rate: float
    primary_country: str
    age_groups: Dict[str, float] = {}
    gender_ratio: Dict[str, float] = {}
    interests: List[str] = []
    growth_trends: List[Dict[str, Any]] = []
    content_categories: Dict[str, float] = {}

class InfluencerProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    bio: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_handle: Optional[str] = None
    linkedin_handle: Optional[str] = None
    twitter_handle: Optional[str] = None
    creator_category: str
    niches: List[str] = []
    expected_charge: float
    portfolio_urls: List[str] = []
    previous_brands: List[str] = []
    trust_score: float
    created_at: datetime
    social_data: List[SocialDataSchema] = []

    class Config:
        from_attributes = True

# --- CAMPAIGN SCHEMAS ---
class CampaignCreate(BaseModel):
    product_name: str
    product_category: str
    product_description: str
    budget: float
    campaign_goal: str
    target_audience: str
    campaign_duration_days: int
    target_location: str
    preferred_platform: str

class CampaignResponse(BaseModel):
    id: str
    brand_profile_id: str
    product_name: str
    product_category: str
    product_description: str
    budget: float
    campaign_goal: str
    target_audience: str
    campaign_duration_days: int
    target_location: str
    preferred_platform: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- COLLABORATION SCHEMAS ---
class CollaborationCreate(BaseModel):
    campaign_id: str
    influencer_profile_id: str
    offer_budget: float
    brand_message: Optional[str] = None

class CollaborationUpdate(BaseModel):
    status: str # accepted, rejected, negotiating
    offer_budget: Optional[float] = None
    influencer_message: Optional[str] = None
    brand_message: Optional[str] = None
    sender_role: str # brand or influencer

class CollaborationResponse(BaseModel):
    id: str
    campaign_id: str
    influencer_profile_id: str
    offer_budget: float
    brand_message: Optional[str] = None
    influencer_message: Optional[str] = None
    status: str
    sender_role: str
    created_at: datetime
    campaign: Optional[CampaignResponse] = None
    influencer: Optional[Any] = None # Will resolve in route

    class Config:
        from_attributes = True

# --- AI & ANALYTICS SCHEMAS ---
class InfluencerRecommendation(BaseModel):
    influencer_id: str
    full_name: str
    match_score: float
    ranking: int
    compatibility_analysis: str
    expected_charge: float
    engagement_rate: float
    platform: str
    followers_count: int

class BrandFitReport(BaseModel):
    audience_fit_score: float
    demographic_report: str
    interest_compatibility_report: str

class CampaignSimulationCreate(BaseModel):
    scenario_name: str
    budget: float
    influencer_ids: List[str]

class CampaignSimulationResponse(BaseModel):
    id: str
    campaign_id: str
    scenario_name: str
    budget: float
    expected_reach: int
    expected_engagement: float
    expected_conversions: int
    expected_revenue: float
    expected_roi: float

class ROIPredictionResponse(BaseModel):
    expected_revenue: float
    expected_roi: float
    cost_per_conversion: float
    profitability_score: float
    roi_score: float

class SentimentAnalysisResponse(BaseModel):
    positive_pct: float
    neutral_pct: float
    negative_pct: float
    analysis_summary: str

class CampaignAdvisorResponse(BaseModel):
    best_influencer_recommendation: str
    detailed_reasoning: str
    optimization_suggestions: List[str]
    risk_analysis: str
    budget_allocation_advice: str
