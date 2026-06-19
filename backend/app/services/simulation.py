import numpy as np
import pandas as pd
import json

# Try to import XGBoost, fallback to scikit-learn or math models
try:
    import xgboost as xgb
    HAS_XGB = True
except Exception:
    HAS_XGB = False

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    HAS_SKLEARN = True
except Exception:
    HAS_SKLEARN = False

# We will build a helper that fits a predictive model on synthetic campaign data.
# This data simulates a standard influencer marketing database where:
# - Reach is correlated with total followers and platform.
# - Engagement is correlated with followers (smaller creators have higher ER) and niche.
# - Conversions is correlated with budget, engagement, and category match.
# - Revenue is correlated with conversions and product pricing.

def generate_synthetic_campaign_data(size=200):
    """Generates synthetic historical campaign data for training the regressor."""
    np.random.seed(42)
    
    budgets = np.random.uniform(500, 50000, size)
    total_followers = budgets * np.random.uniform(10, 50, size)
    avg_engagement_rate = np.random.uniform(0.5, 8.0, size)
    # Higher follower size generally means lower engagement rate
    avg_engagement_rate = avg_engagement_rate * (1.0 - (np.log10(total_followers) / 8.0))
    avg_engagement_rate = np.clip(avg_engagement_rate, 0.2, 12.0)
    
    # Reach is typically 10% to 30% of total followers, boosted by budget
    reach = total_followers * np.random.uniform(0.1, 0.35, size) + (budgets * 2.0)
    reach = np.clip(reach, 100, total_followers * 1.5).astype(int)
    
    # Engagement count is reach * engagement_rate / 100
    engagement_count = reach * (avg_engagement_rate / 100.0) * np.random.uniform(0.8, 1.2, size)
    engagement_count = np.clip(engagement_count, 10, reach).astype(int)
    
    # Conversions are typically 0.5% to 4.0% of engagement
    conversions = engagement_count * np.random.uniform(0.005, 0.05, size)
    conversions = np.clip(conversions, 0, engagement_count).astype(int)
    
    # Revenue is conversions * avg order value ($35 to $150)
    revenue = conversions * np.random.uniform(35, 120, size)
    
    # ROI = revenue / budget
    roi = revenue / budgets
    
    df = pd.DataFrame({
        "budget": budgets,
        "total_followers": total_followers,
        "avg_engagement_rate": avg_engagement_rate,
        "reach": reach,
        "engagement": engagement_count,
        "conversions": conversions,
        "revenue": revenue,
        "roi": roi
    })
    return df

# Initialize models
reach_model = None
engagement_model = None
conversions_model = None
revenue_model = None

def train_prediction_models():
    """Trains the predictive models using XGBoost or Scikit-learn Random Forests."""
    global reach_model, engagement_model, conversions_model, revenue_model
    
    df = generate_synthetic_campaign_data()
    X = df[["budget", "total_followers", "avg_engagement_rate"]]
    
    y_reach = df["reach"]
    y_eng = df["engagement"]
    y_conv = df["conversions"]
    y_rev = df["revenue"]
    
    if HAS_XGB:
        try:
            reach_model = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42)
            engagement_model = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42)
            conversions_model = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42)
            revenue_model = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42)
            
            reach_model.fit(X, y_reach)
            engagement_model.fit(X, y_eng)
            conversions_model.fit(X, y_conv)
            revenue_model.fit(X, y_rev)
            return
        except Exception:
            pass
            
    if HAS_SKLEARN:
        try:
            reach_model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
            engagement_model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
            conversions_model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
            revenue_model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
            
            reach_model.fit(X, y_reach)
            engagement_model.fit(X, y_eng)
            conversions_model.fit(X, y_conv)
            revenue_model.fit(X, y_rev)
            return
        except Exception:
            pass
            
    # Simple mathematical coefficient regression if nothing else is installed
    reach_model = "heuristic"

# Train models on import
train_prediction_models()

def run_campaign_simulation(budget: float, influencers: list) -> dict:
    """
    Simulates campaign metrics based on budget and selected influencers.
    Calculates outputs in Indian Rupees (INR ₹).
    """
    global reach_model, engagement_model, conversions_model, revenue_model
    
    # Calculate aggregate creator parameters
    total_followers = 0
    engagement_rates = []
    trust_scores = []
    
    for inf in influencers:
        for data in inf.social_data:
            total_followers += data.followers_count
            engagement_rates.append(data.engagement_rate)
        trust_scores.append(inf.trust_score or 7.5)
            
    if not influencers:
        # Default scenario if no influencers selected (scaled by budget in INR)
        total_followers = int(budget * 5.0)
        avg_er = 2.5
        avg_trust = 7.5
    else:
        avg_er = np.mean(engagement_rates) if engagement_rates else 2.5
        avg_trust = np.mean(trust_scores)
        
    X_pred = pd.DataFrame([{
        "budget": budget,
        "total_followers": total_followers,
        "avg_engagement_rate": avg_er
    }])
    
    # 1. Predictions
    if reach_model != "heuristic" and reach_model is not None:
        try:
            expected_reach = int(reach_model.predict(X_pred)[0])
            expected_eng = float(engagement_model.predict(X_pred)[0])
            expected_conv = int(conversions_model.predict(X_pred)[0])
            expected_rev = float(revenue_model.predict(X_pred)[0])
        except Exception:
            reach_model = "heuristic"
            
    if reach_model == "heuristic" or reach_model is None:
        # High fidelity mathematical heuristic
        # Reach: 10% to 30% of total followers, boosted slightly by budget
        expected_reach = int(total_followers * 0.22 + (budget * 0.1))
        # Engagement count: reach * engagement rate
        expected_eng = expected_reach * (avg_er / 100.0)
        # Conversions: 1.5% to 4.5% of engagement, scaled by creator trust
        expected_conv = int(expected_eng * 0.024 * (avg_trust / 7.5))
        # Revenue: conversions * average order value of INR 1,200
        expected_rev = expected_conv * 1200.0
        
    # Ensure minimum sanity limits
    expected_reach = max(100, expected_reach)
    expected_eng = max(5, int(expected_eng))
    expected_conv = max(0, expected_conv)
    expected_rev = max(0.0, expected_rev)
    
    # ROI Prediction calculations
    expected_roi = expected_rev / budget if budget > 0 else 0.0
    cost_per_conversion = budget / expected_conv if expected_conv > 0 else budget
    profitability_score = min(10.0, max(0.0, (expected_rev - budget) / budget * 3.0)) # out of 10
    roi_score = min(10.0, max(0.0, expected_roi * 2.0)) # out of 10, where 5x ROI is a 10/10 score
    
    return {
        "expected_reach": expected_reach,
        "expected_engagement": expected_eng,
        "expected_conversions": expected_conv,
        "expected_revenue": expected_rev,
        "expected_roi": expected_roi,
        "cost_per_conversion": cost_per_conversion,
        "profitability_score": profitability_score,
        "roi_score": roi_score
    }

