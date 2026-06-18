import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.db import get_db
from backend.app.models import User, BrandProfile
from backend.app.schemas import BrandProfileCreate, BrandProfileUpdate, BrandProfileResponse
from backend.app.routers.auth import get_current_active_brand

router = APIRouter(prefix="/brand", tags=["Brand Profile"])

def format_brand_response(profile: BrandProfile) -> dict:
    """Helper to convert db model strings to JSON lists for Pydantic validation."""
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "company_name": profile.company_name,
        "industry": profile.industry,
        "website": profile.website,
        "location": profile.location,
        "gst_number": profile.gst_number,
        "business_reg_number": profile.business_reg_number,
        "budget_range_min": profile.budget_range_min,
        "budget_range_max": profile.budget_range_max,
        "marketing_goals": json.loads(profile.marketing_goals or "[]"),
        "target_markets": json.loads(profile.target_markets or "[]"),
        "created_at": profile.created_at
    }

@router.post("/profile", response_model=BrandProfileResponse, status_code=status.HTTP_201_CREATED)
def create_brand_profile(
    profile_in: BrandProfileCreate,
    current_user: User = Depends(get_current_active_brand),
    db: Session = Depends(get_db)
):
    # Check if profile exists
    existing_profile = db.query(BrandProfile).filter(BrandProfile.user_id == current_user.id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand profile already exists. Use PUT to update."
        )
        
    profile = BrandProfile(
        user_id=current_user.id,
        company_name=profile_in.company_name,
        industry=profile_in.industry,
        website=profile_in.website,
        location=profile_in.location,
        gst_number=profile_in.gst_number,
        business_reg_number=profile_in.business_reg_number,
        budget_range_min=profile_in.budget_range_min,
        budget_range_max=profile_in.budget_range_max,
        marketing_goals=json.dumps(profile_in.marketing_goals),
        target_markets=json.dumps(profile_in.target_markets)
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return format_brand_response(profile)

@router.get("/profile", response_model=BrandProfileResponse)
def get_brand_profile(
    current_user: User = Depends(get_current_active_brand),
    db: Session = Depends(get_db)
):
    profile = db.query(BrandProfile).filter(BrandProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand profile not found."
        )
    return format_brand_response(profile)

@router.put("/profile", response_model=BrandProfileResponse)
def update_brand_profile(
    profile_in: BrandProfileUpdate,
    current_user: User = Depends(get_current_active_brand),
    db: Session = Depends(get_db)
):
    profile = db.query(BrandProfile).filter(BrandProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand profile not found."
        )
        
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ["marketing_goals", "target_markets"]:
            setattr(profile, field, json.dumps(value))
        else:
            setattr(profile, field, value)
            
    db.commit()
    db.refresh(profile)
    return format_brand_response(profile)
