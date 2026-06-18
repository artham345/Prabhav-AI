from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.db import Base, engine
from backend.app.routers import auth, brand, influencer, campaigns, collaborations

# Trigger automatic database tables creation
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware to allow cross-origin requests from our React Vite client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(brand.router, prefix=settings.API_V1_STR)
app.include_router(influencer.router, prefix=settings.API_V1_STR)
app.include_router(campaigns.router, prefix=settings.API_V1_STR)
app.include_router(collaborations.router, prefix=settings.API_V1_STR)

@app.get("/")
def root_endpoint():
    return {
        "status": "online",
        "message": "Welcome to Prabhav AI REST API endpoints",
        "version": settings.VERSION
    }
