import json
import os
from backend.app.core.config import settings

# Try to configure Gemini API
HAS_GEMINI_KEY = False
if settings.GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        HAS_GEMINI_KEY = True
    except Exception:
        pass

def get_fallback_advice(campaign, recommendations: list) -> dict:
    """Generates structured advice based on campaign parameters and ranking list."""
    if not recommendations:
        return {
            "best_influencer_recommendation": "No influencers found",
            "detailed_reasoning": "Please register creators to receive recommendations.",
            "optimization_suggestions": [
                "Diversify targets by connecting more platforms.",
                "Ensure your campaign descriptions explicitly detail your niche."
            ],
            "risk_analysis": "Zero audience reach risk due to no matched profiles.",
            "budget_allocation_advice": "Allocate 100% of budget to test runs."
        }
        
    best_creator = recommendations[0]
    creator_name = best_creator["full_name"]
    match_score = best_creator["match_score"]
    
    # Custom advice based on campaign goals
    goal = (campaign.campaign_goal or "").lower()
    budget = campaign.budget
    
    if "conversion" in goal or "sales" in goal:
        opt_sugs = [
            f"Set up customized tracking links (UTM) for {creator_name} to measure conversions accurately.",
            "Offer a 10% discount promo code unique to this influencer's community to drive sales urgency.",
            "Schedule a secondary post 10 days after the primary release to capture late-buying audience segments."
        ]
        risk = (
            f"If {creator_name} has high expected charges, the cost-per-acquisition might initially be elevated. "
            f"Ensure the product landing page is fully optimized for mobile checkouts prior to launch."
        )
        allocation = (
            f"Spend 70% (${budget * 0.7:,.2f}) of your budget on {creator_name}'s upfront video integration. "
            f"Allocate the remaining 30% (${budget * 0.3:,.2f}) as a performance bonus based on coupon usage."
        )
    elif "reach" in goal or "brand awareness" in goal:
        opt_sugs = [
            "Opt for Reels or Short-form YouTube Videos to maximize algorithmic amplification.",
            "Coordinate a simultaneous post across multiple creator platforms (e.g. Instagram + X) to boost reach frequency.",
            "Request organic distribution rights to boost their posts via Brand Sponsor Ads."
        ]
        risk = (
            f"High reach does not guarantee high buyer intent. "
            f"Watch for click-through dropoffs if the product messaging is too generic."
        )
        allocation = (
            f"Deploy 80% (${budget * 0.8:,.2f}) on creator flat rates. "
            f"Reserve 20% (${budget * 0.2:,.2f}) for paid social retargeting ads to users who engaged with the creator's video."
        )
    else: # engagement/default
        opt_sugs = [
            f"Conduct an interactive Giveaway run by {creator_name} to stimulate comments and product tags.",
            "Request video reviews focusing on user pain-points and interactive Q&A in the comments.",
            "Engage in the comment section as the official Brand account to drive direct customer interaction."
        ]
        risk = (
            "Audience engagement might stay limited to contest entries rather than actual brand interest. "
            "Structure the rules to require checking out the brand page."
        )
        allocation = (
            f"Allocate 60% (${budget * 0.6:,.2f}) for upfront video fee. "
            f"Reserve 40% (${budget * 0.4:,.2f}) for product inventory, giveaways, and sample shipping costs."
        )
        
    return {
        "best_influencer_recommendation": f"{creator_name} (Match Score: {match_score}%)",
        "detailed_reasoning": (
            f"{creator_name} is the optimal choice because their content embeddings align closely with your product, "
            f"'{campaign.product_name}'. Their primary audience matches your preferred location, and their past engagement "
            f"profile indicates high follower loyalty and trust."
        ),
        "optimization_suggestions": opt_sugs,
        "risk_analysis": risk,
        "budget_allocation_advice": allocation
    }

def get_campaign_advice(campaign, recommendations: list) -> dict:
    """
    Asks Gemini to analyze the campaign and recommendations to output advanced advisory content.
    Falls back to a robust rule-based advisor if Gemini is not set up or fails.
    """
    if not HAS_GEMINI_KEY:
        return get_fallback_advice(campaign, recommendations)
        
    try:
        import google.generativeai as genai
        
        # Prepare recommendation data for Gemini prompt
        top_recs = recommendations[:5]
        recs_str = ""
        for r in top_recs:
            recs_str += (
                f"- Creator: {r['full_name']} (ID: {r['influencer_id']})\n"
                f"  Match Score: {r['match_score']}%\n"
                f"  Primary Platform: {r['platform']}\n"
                f"  Followers: {r['followers_count']:,}\n"
                f"  Engagement Rate: {r['engagement_rate']}%\n"
                f"  Expected Cost: ${r['expected_charge']:,.2f}\n"
                f"  Compatibility: {r['compatibility_analysis']}\n\n"
            )
            
        prompt = (
            f"You are the senior marketing advisor for Prabhav AI.\n"
            f"Analyze this campaign brief and list of top recommended creators to generate a campaign advisory plan.\n\n"
            f"Campaign Details:\n"
            f"- Product: {campaign.product_name}\n"
            f"- Description: {campaign.product_description}\n"
            f"- Budget: ${campaign.budget:,.2f}\n"
            f"- Goal: {campaign.campaign_goal}\n"
            f"- Target Audience: {campaign.target_audience}\n"
            f"- Location: {campaign.target_location}\n"
            f"- Preferred Platform: {campaign.preferred_platform}\n\n"
            f"Top Recommended Creators:\n"
            f"{recs_str}\n"
            f"Generate a JSON response matching the following keys:\n"
            f"{{\n"
            f"  \"best_influencer_recommendation\": \"Name of creator with match score\",\n"
            f"  \"detailed_reasoning\": \"Explain why they are chosen, mapping their content focus to the product.\",\n"
            f"  \"optimization_suggestions\": [\"suggestion 1\", \"suggestion 2\", \"suggestion 3\"],\n"
            f"  \"risk_analysis\": \"Identify risks (e.g. budget fit, platform alignment, audience overlaps)\",\n"
            f"  \"budget_allocation_advice\": \"Step-by-step allocation details for the budget\"\n"
            f"}}\n"
            f"Return ONLY valid JSON. Do not include markdown code block formatting like ```json."
        )
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown code blocks if the model ignored instructions
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("\n", 1)[0]
            
        data = json.loads(text.strip())
        
        # Ensure all required keys exist
        required_keys = ["best_influencer_recommendation", "detailed_reasoning", "optimization_suggestions", "risk_analysis", "budget_allocation_advice"]
        for key in required_keys:
            if key not in data:
                # Fill missing keys from fallback
                fallback = get_fallback_advice(campaign, recommendations)
                data[key] = fallback[key]
                
        return data
        
    except Exception:
        # Gracefully handle API timeout/exceptions
        return get_fallback_advice(campaign, recommendations)
