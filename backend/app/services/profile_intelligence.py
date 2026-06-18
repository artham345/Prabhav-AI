import json
import numpy as np

# Try importing deep learning libraries, fallback if unavailable
try:
    from sentence_transformers import SentenceTransformer
    SBERT_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    HAS_SBERT = True
except Exception:
    HAS_SBERT = False
    SBERT_MODEL = None

try:
    from transformers import pipeline
    CLASSIFIER = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")
    HAS_CLASSIFIER = True
except Exception:
    HAS_CLASSIFIER = False
    CLASSIFIER = None

# Fallback TF-IDF setup
if not HAS_SBERT:
    from sklearn.feature_extraction.text import TfidfVectorizer
    # We will instantiate a local vectorizer for text
    DEFAULT_VOCAB = ["fitness", "gym", "workout", "nutrition", "diet", "healthy", "food", "lifestyle", "fashion", "travel", "vlog", "tech", "coding", "finance", "investing", "crypto", "gaming", "playstation", "xbox", "makeup", "beauty", "cosmetics"]
    TFIDF = TfidfVectorizer(vocabulary=DEFAULT_VOCAB)
    TFIDF.fit([" ".join(DEFAULT_VOCAB)])

# Standard creator niches for zero-shot
NICHE_CATEGORIES = ["Fitness", "Nutrition", "Lifestyle", "Technology", "Fashion & Beauty", "Travel & Adventure", "Finance & Investing", "Gaming", "Business & Entrepreneurship"]

def get_text_embedding(text: str) -> list:
    """Generates text embedding vector using SBERT or falls back to TF-IDF representation."""
    if HAS_SBERT and SBERT_MODEL:
        try:
            emb = SBERT_MODEL.encode(text)
            return emb.tolist()
        except Exception:
            pass
            
    # Fallback to TF-IDF pseudo-embedding of size 384 (padded TF-IDF vocab size)
    try:
        vec = TFIDF.transform([text.lower()]).toarray()[0]
        # Pad or truncate to 384 dimensions to match typical SBERT sizes
        padded = np.zeros(384)
        padded[:len(vec)] = vec
        # Add a tiny amount of noise based on text length to keep embeddings unique
        char_sum = sum(ord(c) for c in text) % 384
        padded[char_sum] = 1.0
        # Normalize
        norm = np.linalg.norm(padded)
        if norm > 0:
            padded = padded / norm
        return padded.tolist()
    except Exception:
        # Absolute fallback: random but deterministic vector based on text hash
        np.random.seed(hash(text) % 2**32)
        vec = np.random.randn(384)
        vec = vec / np.linalg.norm(vec)
        return vec.tolist()

def classify_text_categories(text: str) -> dict:
    """Classifies text into niches using zero-shot classification or falls back to keyword-based score."""
    if HAS_CLASSIFIER and CLASSIFIER:
        try:
            res = CLASSIFIER(text, candidate_labels=NICHE_CATEGORIES)
            return dict(zip(res["labels"], res["scores"]))
        except Exception:
            pass
            
    # Fallback keyword-matching classifier
    text_lower = text.lower()
    keywords = {
        "Fitness": ["gym", "workout", "fitness", "training", "exercise", "bodybuilding", "lifting", "runner", "cardio"],
        "Nutrition": ["diet", "recipe", "nutrition", "meal", "protein", "healthy eating", "vegan", "calorie", "keto"],
        "Lifestyle": ["vlog", "day in the life", "morning routine", "home decor", "lifestyle", "aesthetic", "daily", "chill"],
        "Technology": ["tech", "software", "developer", "coding", "gadgets", "review", "iphone", "ai", "programming", "startup"],
        "Fashion & Beauty": ["makeup", "skincare", "outfit", "ootd", "fashion", "haul", "beauty", "cosmetics", "style"],
        "Travel & Adventure": ["travel", "wanderlust", "flight", "hotel", "explore", "nature", "trip", "backpacking", "vacation"],
        "Finance & Investing": ["finance", "stocks", "investing", "crypto", "bitcoin", "money", "savings", "budgeting", "market"],
        "Gaming": ["gaming", "gamer", "streamer", "twitch", "playstation", "xbox", "nintendo", "pc building", "gameplay"],
        "Business & Entrepreneurship": ["business", "marketing", "entrepreneur", "saas", "hustle", "startup", "productivity", "agency"]
    }
    
    scores = {}
    total_score = 0.0
    for category, words in keywords.items():
        score = sum(text_lower.count(word) for word in words)
        scores[category] = float(score)
        total_score += score
        
    if total_score == 0.0:
        # Uniform distribution if no keywords match
        return {cat: 1.0 / len(NICHE_CATEGORIES) for cat in NICHE_CATEGORIES}
        
    # Normalize
    for category in scores:
        scores[category] = scores[category] / total_score
        
    return scores

def analyze_creator_posts(posts: list) -> dict:
    """
    Takes a list of simulated social posts, generates embeddings,
    classifies each post, and aggregates results to return the unified creator profile.
    """
    if not posts:
        return {
            "dominant_niches": {"Lifestyle": 1.0},
            "mean_embedding": get_text_embedding("Empty profile"),
            "expertise_areas": ["Lifestyle"]
        }
        
    embeddings = []
    category_scores = {cat: 0.0 for cat in NICHE_CATEGORIES}
    
    for post in posts:
        embeddings.append(get_text_embedding(post))
        post_cats = classify_text_categories(post)
        for cat, val in post_cats.items():
            category_scores[cat] += val
            
    # Calculate average category scores
    num_posts = len(posts)
    avg_categories = {cat: score / num_posts for cat, score in category_scores.items()}
    
    # Sort and filter categories with > 5% contribution
    sorted_niches = sorted(avg_categories.items(), key=lambda x: x[1], reverse=True)
    dominant_niches = {cat: round(score, 3) for cat, score in sorted_niches if score >= 0.05}
    
    # Calculate mean embedding vector
    mean_embedding = np.mean(embeddings, axis=0).tolist()
    
    # Pick top 3 areas of expertise
    expertise_areas = [cat for cat, _ in sorted_niches[:3]]
    
    return {
        "dominant_niches": dominant_niches,
        "mean_embedding": mean_embedding,
        "expertise_areas": expertise_areas
    }
