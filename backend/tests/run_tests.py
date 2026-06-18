import os
import sys
import unittest
import json

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.app.core.security import get_password_hash, verify_password, create_access_token
from backend.app.core.db import SessionLocal, Base, engine
from backend.app.models import User, BrandProfile, InfluencerProfile, SocialPlatformData, Campaign
from backend.app.services.profile_intelligence import get_text_embedding, classify_text_categories, analyze_creator_posts
from backend.app.services.recommendation import recommend_influencers
from backend.app.services.brand_fit import analyze_audience_brand_fit
from backend.app.services.simulation import run_campaign_simulation
from backend.app.services.sentiment import analyze_comments_sentiment
from backend.app.services.advisor import get_campaign_advice

class TestPrabhavAIBackend(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Create tables
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()
        
    @classmethod
    def tearDownClass(cls):
        cls.db.close()
        
    def test_security_utilities(self):
        """Test password hashing, verification, and JWT creation."""
        password = "test_secure_password_123"
        hashed = get_password_hash(password)
        
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("wrong_password", hashed))
        
        token = create_access_token(subject="user-uuid-12345")
        self.assertIsNotNone(token)
        self.assertTrue(len(token) > 20)
        
    def test_database_persistence(self):
        """Test creating a mock Brand and Influencer and reading them back."""
        # Create Brand User
        brand_user = User(email="test_brand@prabhav.ai", password_hash="hash", role="brand")
        self.db.add(brand_user)
        self.db.commit()
        
        brand_prof = BrandProfile(
            user_id=brand_user.id,
            company_name="Vedic Organics",
            industry="FMCG & Wellness",
            location="Mumbai, IN",
            budget_range_min=1000,
            budget_range_max=10000,
            marketing_goals=json.dumps(["awareness", "sales"]),
            target_markets=json.dumps(["India", "UAE"])
        )
        self.db.add(brand_prof)
        self.db.commit()
        
        # Verify Brand Profile
        fetched_brand = self.db.query(BrandProfile).filter(BrandProfile.user_id == brand_user.id).first()
        self.assertIsNotNone(fetched_brand)
        self.assertEqual(fetched_brand.company_name, "Vedic Organics")
        self.assertIn("awareness", json.loads(fetched_brand.marketing_goals))
        
        # Clean up
        self.db.delete(brand_prof)
        self.db.delete(brand_user)
        self.db.commit()
        
    def test_profile_intelligence_and_embeddings(self):
        """Test SBERT / TF-IDF embedding generation and Zero-shot / keyword categorization."""
        text = "Just finished my leg day workout at the gym, nutrition is key!"
        
        emb = get_text_embedding(text)
        self.assertEqual(len(emb), 384) # Assert vector size
        
        cats = classify_text_categories(text)
        self.assertIn("Fitness", cats)
        self.assertIn("Nutrition", cats)
        self.assertTrue(cats["Fitness"] > 0)
        
        # Test posts analysis
        posts = [
            "Heavy squat day in the gym today, pushed my limits.",
            "Meal prep sunday: clean proteins, greens, and complex carbs."
        ]
        intelligence = analyze_creator_posts(posts)
        self.assertIn("Fitness", intelligence["dominant_niches"])
        self.assertIn("Nutrition", intelligence["dominant_niches"])
        self.assertEqual(len(intelligence["mean_embedding"]), 384)
        
    def test_recommendation_system(self):
        """Test influencer matching and cosine similarity recommendation rankings."""
        # Setup mock campaign
        class MockCampaign:
            product_name = "Eco Gym Mat"
            product_description = "Organic rubber exercise mats for yoga, pilates and fitness workouts."
            campaign_goal = "Conversions"
            budget = 5000.0
            target_location = "United States"
            preferred_platform = "Instagram"
            
        class MockSocialData:
            platform = "Instagram"
            followers_count = 50000
            engagement_rate = 4.5
            primary_country = "US"
            content_embeddings = None
            
        class MockInfluencer:
            id = "creator-1"
            full_name = "Alex Trainer"
            bio = "Certified yoga and athletic workout coach."
            instagram_handle = "@alex_fit"
            youtube_handle = None
            linkedin_handle = None
            twitter_handle = None
            creator_category = "Fitness"
            niches = json.dumps(["Fitness"])
            expected_charge = 1200.0
            social_data = [MockSocialData()]
            
        campaign = MockCampaign()
        influencers = [MockInfluencer()]
        
        recs = recommend_influencers(campaign, influencers)
        self.assertEqual(len(recs), 1)
        self.assertEqual(recs[0]["influencer_id"], "creator-1")
        self.assertTrue(recs[0]["match_score"] > 50.0) # Check reasonable match score
        
    def test_campaign_simulation_and_roi(self):
        """Test XGBoost campaign simulator and predictions."""
        # Setup mock inputs
        class MockSocialData:
            followers_count = 100000
            engagement_rate = 3.2
            
        class MockInfluencer:
            social_data = [MockSocialData()]
            
        influencers = [MockInfluencer()]
        budget = 2000.0
        
        sim = run_campaign_simulation(budget, influencers)
        self.assertTrue(sim["expected_reach"] > 0)
        self.assertTrue(sim["expected_conversions"] >= 0)
        self.assertTrue(sim["expected_revenue"] >= 0.0)
        self.assertTrue(sim["expected_roi"] >= 0.0)
        self.assertTrue(sim["roi_score"] >= 0.0)
        
    def test_sentiment_analysis(self):
        """Test RoBERTa / rule-based sentiment scoring percentages."""
        comments = [
            "This product is absolutely amazing! Changed my life.",
            "I hate this, waste of money.",
            "It works okay but shipping took too long."
        ]
        res = analyze_comments_sentiment(comments)
        self.assertTrue(res["positive_pct"] > 0)
        self.assertTrue(res["negative_pct"] > 0)
        self.assertTrue(res["neutral_pct"] > 0)
        self.assertIn("analysis_summary", res)

if __name__ == "__main__":
    unittest.main()
