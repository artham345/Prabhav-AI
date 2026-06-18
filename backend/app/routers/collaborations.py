from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.db import get_db
from backend.app.models import User, Collaboration, Campaign, InfluencerProfile, BrandProfile
from backend.app.schemas import CollaborationCreate, CollaborationUpdate, CollaborationResponse
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/collaborations", tags=["Collaboration Marketplace"])

def format_collaboration(collab: Collaboration) -> dict:
    """Formats collaboration relation items into JSON response format."""
    # Convert influencer profile structure
    inf = collab.influencer
    influencer_response = {
        "id": inf.id,
        "full_name": inf.full_name,
        "creator_category": inf.creator_category,
        "expected_charge": inf.expected_charge,
        "trust_score": inf.trust_score
    } if inf else None
    
    return {
        "id": collab.id,
        "campaign_id": collab.campaign_id,
        "influencer_profile_id": collab.influencer_profile_id,
        "offer_budget": collab.offer_budget,
        "brand_message": collab.brand_message,
        "influencer_message": collab.influencer_message,
        "status": collab.status,
        "sender_role": collab.sender_role,
        "created_at": collab.created_at,
        "campaign": collab.campaign,
        "influencer": influencer_response
    }

@router.post("", response_model=CollaborationResponse, status_code=status.HTTP_201_CREATED)
def create_collaboration_offer(
    collab_in: CollaborationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "brand":
        raise HTTPException(status_code=403, detail="Only brand users can send collaboration offers.")
        
    brand = db.query(BrandProfile).filter(BrandProfile.user_id == current_user.id).first()
    campaign = db.query(Campaign).filter(Campaign.id == collab_in.campaign_id, Campaign.brand_profile_id == brand.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found or does not belong to this brand.")
        
    influencer = db.query(InfluencerProfile).filter(InfluencerProfile.id == collab_in.influencer_profile_id).first()
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer profile not found.")
        
    # Check if duplicate collaboration already active
    existing = db.query(Collaboration).filter(
        Collaboration.campaign_id == collab_in.campaign_id,
        Collaboration.influencer_profile_id == collab_in.influencer_profile_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An offer has already been sent to this influencer for this campaign.")
        
    collab = Collaboration(
        campaign_id=collab_in.campaign_id,
        influencer_profile_id=collab_in.influencer_profile_id,
        offer_budget=collab_in.offer_budget,
        brand_message=collab_in.brand_message,
        status="sent",
        sender_role="brand"
    )
    db.add(collab)
    db.commit()
    db.refresh(collab)
    return format_collaboration(collab)

@router.get("", response_model=list[CollaborationResponse])
def list_collaborations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists offers. If user is brand, lists sent offers. If user is influencer, lists received offers."""
    if current_user.role == "brand":
        brand = db.query(BrandProfile).filter(BrandProfile.user_id == current_user.id).first()
        if not brand:
            return []
        collabs = db.query(Collaboration).join(Campaign).filter(Campaign.brand_profile_id == brand.id).all()
    else:
        inf = db.query(InfluencerProfile).filter(InfluencerProfile.user_id == current_user.id).first()
        if not inf:
            return []
        collabs = db.query(Collaboration).filter(Collaboration.influencer_profile_id == inf.id).all()
        
    return [format_collaboration(c) for c in collabs]

@router.put("/{collab_id}", response_model=CollaborationResponse)
def update_collaboration_status(
    collab_id: str,
    collab_update: CollaborationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    collab = db.query(Collaboration).filter(Collaboration.id == collab_id).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration offer not found.")
        
    status_lower = collab_update.status.lower()
    if status_lower not in ["accepted", "rejected", "negotiating"]:
        raise HTTPException(status_code=400, detail="Invalid status update. Must be accepted, rejected, or negotiating.")
        
    collab.status = status_lower
    collab.sender_role = collab_update.sender_role
    
    if collab_update.offer_budget is not None:
        collab.offer_budget = collab_update.offer_budget
        
    if current_user.role == "brand":
        if collab_update.brand_message:
            collab.brand_message = collab_update.brand_message
    else:
        if collab_update.influencer_message:
            collab.influencer_message = collab_update.influencer_message
            
    db.commit()
    db.refresh(collab)
    return format_collaboration(collab)
