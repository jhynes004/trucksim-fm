from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import SpotifyService AFTER loading environment variables
from spotify_service import SpotifyService

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize Spotify service AFTER env vars are loaded
spotify_service = SpotifyService()


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class SpotifySearchRequest(BaseModel):
    artist: str
    title: str

class SpotifyTrackResponse(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    album_art_url: Optional[str] = None
    album_art_small: Optional[str] = None
    album_art_medium: Optional[str] = None
    release_date: Optional[str] = None
    spotify_url: Optional[str] = None
    duration_ms: Optional[int] = None
    preview_url: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"status": "ok", "message": "TruckSimFM API is running"}

# Health check endpoint on main app
@app.get("/")
async def app_root():
    return {
        "app": "TruckSim FM",
        "status": "running",
        "api_endpoints": "/api",
        "message": "Visit /api for API endpoints. Frontend is served separately."
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TruckSim FM API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/spotify/search", response_model=SpotifyTrackResponse)
async def search_spotify_track(request: SpotifySearchRequest):
    """Search for a track on Spotify and return metadata including album art"""
    try:
        result = spotify_service.search_track(request.artist, request.title)
        if result:
            return SpotifyTrackResponse(**result)
        else:
            # Return empty response if no results found
            return SpotifyTrackResponse()
    except Exception as e:
        logging.error(f"Error in Spotify search endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to search Spotify")

@api_router.get("/current-song")
async def get_current_song():
    """Proxy endpoint to fetch current song from TruckSimFM (avoids CORS issues)"""
    import requests
    try:
        response = requests.get(
            'https://radio.trucksim.fm:8000/currentsong?sid=1',
            timeout=5
        )
        response.raise_for_status()
        song_text = response.text.strip()
        
        logger.info(f"Fetched current song: {song_text}")
        
        return {
            "success": True,
            "data": song_text
        }
    except Exception as e:
        logger.error(f"Error fetching current song: {e}")
        return {
            "success": False,
            "data": "TruckSimFM - Live Radio"
        }

@api_router.get("/schedule")
async def get_schedule():
    """Proxy endpoint to fetch schedule from TruckSimFM (avoids CORS issues)"""
    import requests
    try:
        response = requests.get(
            'https://www.trucksim.fm/api/schedules?populate=*',
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        logger.info(f"Fetched {len(data.get('data', []))} schedule items")
        
        return {
            "success": True,
            "data": data.get('data', [])
        }
    except Exception as e:
        logger.error(f"Error fetching schedule: {e}")
        return {
            "success": False,
            "data": [],
            "error": str(e)
        }

@api_router.get("/recently-played")
async def get_recently_played(limit: int = 5):
    """Proxy endpoint to fetch recently played songs from TruckSimFM"""
    import requests
    try:
        # Fetch playlist data sorted by most recent first
        # The API returns items sorted by ID desc which corresponds to most recent
        response = requests.get(
            f'https://www.trucksim.fm/api/playlists?pagination[limit]={limit}&pagination[start]=0&sort[0]=id:desc',
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        items = data.get('data', [])
        logger.info(f"Fetched {len(items)} recently played items")
        
        # Format the response
        formatted = []
        for item in items:
            formatted.append({
                "artist": item.get("artist", "Unknown"),
                "song": item.get("song", "Unknown"),
                "artwork_url": item.get("artwork_url"),
                "played_at": item.get("played_datetime"),
                "likes": item.get("likes", 0),
            })
        
        return {
            "success": True,
            "data": formatted
        }
    except Exception as e:
        logger.error(f"Error fetching recently played: {e}")
        return {
            "success": False,
            "data": [],
            "error": str(e)
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
