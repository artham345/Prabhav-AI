import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.core.db import Base

# Helper to generate UUIDs as strings
def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # "brand" or "influencer"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    brand_profile = relationship("BrandProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    influencer_profile = relationship("InfluencerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class BrandProfile(Base):
    __tablename__ = "brand_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_name = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=False)
    website = Column(String(255), nullable=True)
    location = Column(String(255), nullable=False)
    gst_number = Column(String(50), nullable=True)
    business_reg_number = Column(String(100), nullable=True)
    budget_range_min = Column(Float, nullable=False)
    budget_range_max = Column(Float, nullable=False)
    
    # String/JSON serialized list
    marketing_goals = Column(Text, nullable=True)  # JSON-encoded array of goals
    target_markets = Column(Text, nullable=True)   # JSON-encoded array of markets
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="brand_profile")
    campaigns = relationship("Campaign", back_populates="brand", cascade="all, delete-orphan")

class InfluencerProfile(Base):
    __tablename__ = "influencer_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    
    # Handles
    instagram_handle = Column(String(100), nullable=True)
    youtube_handle = Column(String(100), nullable=True)
    linkedin_handle = Column(String(100), nullable=True)
    twitter_handle = Column(String(100), nullable=True)
    
    creator_category = Column(String(100), nullable=False) # primary category
    niches = Column(Text, nullable=True)                  # JSON-encoded array of niches
    expected_charge = Column(Float, nullable=False)
    portfolio_urls = Column(Text, nullable=True)          # JSON-encoded array of URLs
    previous_brands = Column(Text, nullable=True)         # JSON-encoded array of brand names
    trust_score = Column(Float, default=7.5)              # Out of 10
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="influencer_profile")
    social_data = relationship("SocialPlatformData", back_populates="influencer", cascade="all, delete-orphan")
    collaborations = relationship("Collaboration", back_populates="influencer", cascade="all, delete-orphan")

class SocialPlatformData(Base):
    __tablename__ = "social_platform_data"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    influencer_profile_id = Column(String(36), ForeignKey("influencer_profiles.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False) # instagram, youtube, linkedin, twitter
    followers_count = Column(Integer, nullable=False, default=0)
    engagement_rate = Column(Float, nullable=False, default=0.0) # percentage
    primary_country = Column(String(100), nullable=False, default="US")
    
    # Demographic & Intelligence data as JSON serialized strings
    age_groups = Column(Text, nullable=True)     # JSON: e.g. {"18-24": 0.45, "25-34": 0.35}
    gender_ratio = Column(Text, nullable=True)   # JSON: e.g. {"male": 0.52, "female": 0.48}
    interests = Column(Text, nullable=True)      # JSON: e.g. ["fitness", "lifestyle"]
    growth_trends = Column(Text, nullable=True)  # JSON: e.g. [{"month": "Jan", "followers": 10000}]
    
    # NLP Ingestion features
    content_embeddings = Column(Text, nullable=True) # SBERT features serialized as JSON list
    content_categories = Column(Text, nullable=True) # Zero-shot categories: {"Fitness": 0.70, "Nutrition": 0.20}
    
    # Relationships
    influencer = relationship("InfluencerProfile", back_populates="social_data")

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_profile_id = Column(String(36), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(255), nullable=False)
    product_category = Column(String(100), nullable=False, default="Fitness")
    product_description = Column(Text, nullable=False)

    budget = Column(Float, nullable=False)
    campaign_goal = Column(String(255), nullable=False) # Reach, Conversions, Engagement
    target_audience = Column(Text, nullable=True)      # JSON description
    campaign_duration_days = Column(Integer, nullable=False, default=30)
    target_location = Column(String(255), nullable=False)
    preferred_platform = Column(String(50), nullable=False)
    status = Column(String(50), default="draft")       # draft, active, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    brand = relationship("BrandProfile", back_populates="campaigns")
    collaborations = relationship("Collaboration", back_populates="campaign", cascade="all, delete-orphan")
    simulations = relationship("CampaignSimulation", back_populates="campaign", cascade="all, delete-orphan")

class Collaboration(Base):
    __tablename__ = "collaborations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    influencer_profile_id = Column(String(36), ForeignKey("influencer_profiles.id", ondelete="CASCADE"), nullable=False)
    offer_budget = Column(Float, nullable=False)
    brand_message = Column(Text, nullable=True)
    influencer_message = Column(Text, nullable=True)
    status = Column(String(50), default="sent")       # sent, negotiating, accepted, rejected
    sender_role = Column(String(50), nullable=False)   # "brand" or "influencer"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    campaign = relationship("Campaign", back_populates="collaborations")
    influencer = relationship("InfluencerProfile", back_populates="collaborations")

class CampaignSimulation(Base):
    __tablename__ = "campaign_simulations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    scenario_name = Column(String(255), nullable=False)
    budget = Column(Float, nullable=False)
    influencer_ids = Column(Text, nullable=True) # JSON list of UUIDs
    
    # Predictions
    expected_reach = Column(Integer, default=0)
    expected_engagement = Column(Float, default=0.0) # count or rate
    expected_conversions = Column(Integer, default=0)
    expected_revenue = Column(Float, default=0.0)
    expected_roi = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    campaign = relationship("Campaign", back_populates="simulations")
