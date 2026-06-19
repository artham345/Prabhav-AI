from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import json
from backend.app.core.db import get_db
from backend.app.models import InfluencerProfile

router = APIRouter(prefix="/market-intelligence", tags=["Market Intelligence"])

# Market trends and benchmark statistics by category
CATEGORY_INTELLIGENCE_METRICS = {
    "fitness": {
        "trending_products": ["Protein Powder", "Creatine Monohydrate", "Electrolyte Mixes", "Smart Fitness Bands", "Home Dumbbell Sets"],
        "cpm_range": "₹800 - ₹2,500",
        "average_roi": "3.8x",
        "niche_keywords": ["gym", "fitness", "workout", "nutrition", "diet"]
    },
    "technology": {
        "trending_products": ["AI Coding Assistants", "Mechanical Keyboards", "Ergonomic Chairs", "Developer Laptops", "Smartphones"],
        "cpm_range": "₹1,500 - ₹4,000",
        "average_roi": "4.2x",
        "niche_keywords": ["tech", "coding", "software", "developer", "gadgets"]
    },
    "finance": {
        "trending_products": ["Tax Filing Software", "SIP Investing Apps", "Mutual Funds Platforms", "Term Life Insurance", "Gold Bonds"],
        "cpm_range": "₹2,000 - ₹5,500",
        "average_roi": "3.5x",
        "niche_keywords": ["finance", "investing", "mutual funds", "stocks", "savings"]
    },
    "education": {
        "trending_products": ["Online ML Bootcamps", "Language Learning Apps", "STEM Kits for Kids", "Certification Courses"],
        "cpm_range": "₹1,000 - ₹3,000",
        "average_roi": "3.1x",
        "niche_keywords": ["education", "learning", "science", "tutorial"]
    },
    "gaming": {
        "trending_products": ["RGB Gaming Keyboards", "Esports Headsets", "Console Controllers", "Graphics Cards", "Gaming Chairs"],
        "cpm_range": "₹600 - ₹1,800",
        "average_roi": "2.9x",
        "niche_keywords": ["gaming", "esports", "playstation", "xbox", "streaming"]
    },
    "fashion": {
        "trending_products": ["Oversized Cotton Shirts", "Minimalist Silver Jewelry", "Sustainable Linens", "Athleisure wear"],
        "cpm_range": "₹1,200 - ₹3,200",
        "average_roi": "4.0x",
        "niche_keywords": ["fashion", "style", "clothing", "ootd"]
    },
    "travel": {
        "trending_products": ["Hard-shell Luggage Bags", "Action Cameras", "Noise-Cancelling Earbuds", "Homestay Bookings"],
        "cpm_range": "₹900 - ₹2,800",
        "average_roi": "3.4x",
        "niche_keywords": ["travel", "mountains", "vlog", "trip", "road trip"]
    },
    "food": {
        "trending_products": ["Air Fryers", "Organic Honey", "Cold-Pressed Oils", "Gourmet Coffee Blends"],
        "cpm_range": "₹700 - ₹2,000",
        "average_roi": "3.7x",
        "niche_keywords": ["food", "recipe", "cooking", "eating"]
    },
    "beauty": {
        "trending_products": ["Tinted Sunscreens", "Salicylic Acid Serums", "Hydrating Lip Oils", "Cleansing Balms"],
        "cpm_range": "₹1,100 - ₹3,500",
        "average_roi": "4.5x",
        "niche_keywords": ["skincare", "makeup", "beauty", "cosmetics"]
    }
}

@router.get("")
def get_market_intelligence(
    category: str = Query(..., description="Industry category to query"),
    db: Session = Depends(get_db)
):
    cat_key = category.lower().strip()
    
    # Resolve category key match
    resolved_key = "fitness"
    for k in CATEGORY_INTELLIGENCE_METRICS:
        if k in cat_key or cat_key in k:
            resolved_key = k
            break
            
    metrics = CATEGORY_INTELLIGENCE_METRICS[resolved_key]
    
    # Query matching creators from the database
    creators = db.query(InfluencerProfile).all()
    recommended_creators = []
    
    for creator in creators:
        creator_cat = creator.creator_category.lower()
        creator_niches = json.loads(creator.niches or "[]")
        
        # Check matching criteria
        is_match = False
        if resolved_key in creator_cat:
            is_match = True
        elif any(keyword in niche.lower() for niche in creator_niches for keyword in metrics["niche_keywords"]):
            is_match = True
            
        if is_match:
            # Get primary platform stats
            followers = 0
            er = 2.5
            if creator.social_data:
                followers = sum(d.followers_count for d in creator.social_data)
                er = creator.social_data[0].engagement_rate
                
            recommended_creators.append({
                "id": creator.id,
                "full_name": creator.full_name,
                "handle": creator.instagram_handle or creator.youtube_handle or creator.linkedin_handle or "@creator",
                "followers_count": followers if followers > 0 else int(creator.expected_charge * 80),
                "engagement_rate": er,
                "expected_charge": creator.expected_charge,
                "trust_score": creator.trust_score
            })
            
    # Sort creators by trust score in descending order
    recommended_creators = sorted(recommended_creators, key=lambda x: x["trust_score"], reverse=True)[:3]
    
    # Fallbacks if no creator is registered in database yet
    if not recommended_creators:
        fallback_names = {
            "fitness": [("Rahul Fitness", "@rahul_fit", 145000, 5.2, 8500), ("Sneha Nutrition", "@sneha_diet", 85000, 6.4, 4500), ("Aman Gym", "@aman_lifting", 112000, 4.8, 6200)],
            "technology": [("Priya Tech", "@priya_codes", 95000, 4.1, 7500), ("Rohit Dev", "@rohit_dev", 54000, 5.8, 5200), ("Vikram Systems", "@vikram_arch", 42000, 3.8, 3800)],
            "finance": [("Amit Finance", "@amit_sip", 180000, 3.2, 12000), ("Karan Capital", "@karan_money", 92000, 4.9, 6500), ("Neelam Wealth", "@neelam_wealth", 75000, 5.1, 5500)]
        }
        
        # Get fallback creators list
        fallbacks = fallback_names.get(resolved_key, [("Rahul Lifestyle", "@rahul_life", 65000, 3.5, 4000), ("Sneha Style", "@sneha_styling", 78000, 4.1, 5000)])
        for name, handle, fols, er_val, charge in fallbacks:
            recommended_creators.append({
                "id": f"mock-{name.lower().replace(' ', '-')}",
                "full_name": name,
                "handle": handle,
                "followers_count": fols,
                "engagement_rate": er_val,
                "expected_charge": charge,
                "trust_score": 8.2
            })
            
    return {
        "industry": category,
        "trending_products": metrics["trending_products"],
        "cpm_range": metrics["cpm_range"],
        "average_roi": metrics["average_roi"],
        "recommended_creators": recommended_creators
    }
