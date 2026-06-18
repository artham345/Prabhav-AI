import numpy as np
import json
from backend.app.services.profile_intelligence import get_text_embedding

def cosine_similarity(v1, v2) -> float:
    """Computes cosine similarity between two vectors."""
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

def recommend_influencers(campaign, influencers) -> list:
    """
    Ranks influencers based on compatibility with a given campaign.
    
    Factors:
    - Content Semantic Match (Cosine Similarity of embeddings): 50%
    - Platform Match (preferred platform vs creator handles): 20%
    - Audience Location Match: 15%
    - Engagement / Charge ratio score: 15%
    """
    # Generate embedding for the campaign description
    camp_text = f"{campaign.product_name} {campaign.product_description} {campaign.campaign_goal}"
    camp_emb = get_text_embedding(camp_text)
    
    recommendations = []
    
    for inf in influencers:
        # 1. Semantic Content Similarity
        # Fetch mean embedding from the influencer's platform data (or calculate one)
        inf_emb = None
        platform_data_list = inf.social_data
        
        # Try to find embedding in platform data
        for data in platform_data_list:
            if data.content_embeddings:
                try:
                    inf_emb = json.loads(data.content_embeddings)
                    break
                except Exception:
                    pass
                    
        # If no embedding found, generate one from the bio & categories
        if not inf_emb:
            bio_text = f"{inf.bio or ''} {inf.creator_category} {' '.join(json.loads(inf.niches or '[]'))}"
            inf_emb = get_text_embedding(bio_text)
            
        semantic_score = cosine_similarity(camp_emb, inf_emb)
        # Shift range from [-1, 1] to [0, 1]
        semantic_score = (semantic_score + 1.0) / 2.0
        
        # 2. Platform Suitability
        platform_score = 0.0
        target_platform = campaign.preferred_platform.lower()
        
        has_instagram = inf.instagram_handle is not None
        has_youtube = inf.youtube_handle is not None
        has_linkedin = inf.linkedin_handle is not None
        has_twitter = inf.twitter_handle is not None
        
        if target_platform == "instagram" and has_instagram:
            platform_score = 1.0
        elif target_platform == "youtube" and has_youtube:
            platform_score = 1.0
        elif target_platform == "linkedin" and has_linkedin:
            platform_score = 1.0
        elif target_platform == "twitter" and has_twitter:
            platform_score = 1.0
        elif target_platform in ["any", "all", "cross-platform"]:
            # Count platforms
            platform_count = sum([has_instagram, has_youtube, has_linkedin, has_twitter])
            platform_score = min(platform_count / 2.0, 1.0) # Cap at 1.0 for 2+ platforms
        else:
            # Matches at least one social handle
            platform_score = 0.4 if (has_instagram or has_youtube or has_linkedin or has_twitter) else 0.0
            
        # 3. Target Location Suitability
        location_score = 0.0
        primary_countries = []
        for data in platform_data_list:
            if data.primary_country:
                primary_countries.append(data.primary_country.lower())
                
        target_loc = campaign.target_location.lower()
        if not primary_countries:
            location_score = 0.5  # Neutral default
        elif any(target_loc in country or country in target_loc for country in primary_countries):
            location_score = 1.0
        else:
            location_score = 0.3
            
        # 4. Engagement & Budget Compatibility
        # Creators whose fees are competitive get a boost
        charge_score = 1.0
        if inf.expected_charge > campaign.budget:
            # Budget deficit penalty
            charge_score = max(0.1, 1.0 - ((inf.expected_charge - campaign.budget) / campaign.budget))
            
        # Engagement score contribution
        avg_engagement = 0.0
        rates = [d.engagement_rate for d in platform_data_list if d.engagement_rate]
        if rates:
            avg_engagement = np.mean(rates)
        engagement_factor = min(avg_engagement / 10.0, 1.0) # normalized, 10% engagement is excellent
        
        econ_score = (charge_score * 0.6) + (engagement_factor * 0.4)
        
        # Calculate Final Weighted Match Score (0.0 to 1.0)
        final_score = (
            (semantic_score * 0.5) +
            (platform_score * 0.2) +
            (location_score * 0.15) +
            (econ_score * 0.15)
        )
        
        # Convert to percentage
        match_percentage = round(final_score * 100, 1)
        
        # Generate short explainable compatibility breakdown
        niches_list = json.loads(inf.niches or "[]")
        niches_str = ", ".join(niches_list) if niches_list else inf.creator_category
        
        analysis = (
            f"Matches {match_percentage}% based on their focus in {niches_str}. "
            f"Expected charge is ${inf.expected_charge:,.2f} against your ${campaign.budget:,.2f} budget. "
        )
        if location_score == 1.0:
            analysis += "Their primary audience is perfectly aligned with your target market."
        else:
            analysis += "Audience geo-distribution is partially aligned."
            
        # Retrieve primary platform stats
        primary_platform = target_platform if target_platform in ["instagram", "youtube", "linkedin", "twitter"] else "instagram"
        followers = 0
        engagement = 2.0
        for data in platform_data_list:
            if data.platform.lower() == primary_platform:
                followers = data.followers_count
                engagement = data.engagement_rate
                break
        if followers == 0 and platform_data_list:
            followers = platform_data_list[0].followers_count
            engagement = platform_data_list[0].engagement_rate
            primary_platform = platform_data_list[0].platform
            
        recommendations.append({
            "influencer_id": inf.id,
            "full_name": inf.full_name,
            "match_score": match_percentage,
            "compatibility_analysis": analysis,
            "expected_charge": inf.expected_charge,
            "engagement_rate": engagement,
            "platform": primary_platform,
            "followers_count": followers
        })
        
    # Sort recommendations by Match Score in descending order
    recommendations = sorted(recommendations, key=lambda x: x["match_score"], reverse=True)
    
    # Assign rankings
    for rank, rec in enumerate(recommendations, start=1):
        rec["ranking"] = rank
        
    return recommendations
