from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from bs4 import BeautifulSoup


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

@api_router.get("/live-presenter")
async def get_live_presenter():
    """Scrape the TruckSimFM website to get the current live presenter"""
    import requests
    try:
        response = requests.get(
            'https://www.trucksim.fm',
            timeout=10,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Look for the live presenter info
        # The website structure shows: LIVE NOW... followed by presenter image and name
        live_section = soup.find(string=re.compile('LIVE NOW', re.IGNORECASE))
        
        presenter_name = None
        show_name = None
        show_description = None
        photo_url = None
        is_auto_dj = False
        
        if live_section:
            # Find the parent container and look for presenter info
            parent = live_section.find_parent('div') if live_section else None
            
            # Try to find presenter name - it's usually in an image alt or nearby text
            # Look for images with presenter photos
            img_tags = soup.find_all('img')
            for img in img_tags:
                alt = img.get('alt', '')
                src = img.get('src', '')
                # Check if this is a presenter image (has username as alt)
                if alt and 'TSFM' not in alt and 'Chart' not in alt and 'logo' not in alt.lower():
                    # Check if the image is in the live section (not in recently played)
                    parent_classes = ' '.join(img.find_parent('div').get('class', []) if img.find_parent('div') else [])
                    if 'recently' not in parent_classes.lower():
                        presenter_name = alt
                        if 'trucksim.fm' in src or '_next/image' in src:
                            photo_url = src
                        break
        
        # If we found a presenter, try to find the show name
        if presenter_name:
            # Look for h2 elements that might contain show name
            h2_tags = soup.find_all('h2')
            for h2 in h2_tags:
                text = h2.get_text(strip=True)
                if text and 'Upcoming' not in text and 'Featured' not in text:
                    show_name = text
                    break
            
            # Look for "Live until" text for description
            live_until = soup.find(string=re.compile('Live until', re.IGNORECASE))
            if live_until:
                show_description = live_until.strip()
        
        # Check if it's the auto-DJ (DJ Cruise Control)
        if presenter_name and 'cruise control' in presenter_name.lower():
            is_auto_dj = True
        elif not presenter_name:
            # Default to auto-DJ if we couldn't find a presenter
            presenter_name = 'DJ Cruise Control'
            show_name = 'Auto DJ'
            show_description = 'Full throttle tunes...'
            is_auto_dj = True
        
        logger.info(f"Scraped live presenter: {presenter_name}, Show: {show_name}")
        
        return {
            "success": True,
            "data": {
                "name": presenter_name,
                "show_name": show_name or f"Live with {presenter_name}",
                "description": show_description or "",
                "photo_url": photo_url,
                "is_auto_dj": is_auto_dj
            }
        }
    except Exception as e:
        logger.error(f"Error scraping live presenter: {e}")
        return {
            "success": True,
            "data": {
                "name": "DJ Cruise Control",
                "show_name": "Auto DJ",
                "description": "Full throttle tunes...",
                "photo_url": None,
                "is_auto_dj": True
            }
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
                "id": item.get("id"),
                "documentId": item.get("documentId"),
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

@api_router.post("/like-song/{document_id}")
async def like_song(document_id: str):
    """Increment like count for a song on TruckSimFM"""
    import requests
    try:
        # First, get the current song data to get the current like count
        get_response = requests.get(
            f'https://www.trucksim.fm/api/playlists/{document_id}',
            timeout=10
        )
        get_response.raise_for_status()
        song_data = get_response.json()
        
        current_likes = song_data.get('data', {}).get('likes', 0) or 0
        new_likes = current_likes + 1
        
        # Update the like count
        update_response = requests.put(
            f'https://www.trucksim.fm/api/playlists/{document_id}',
            json={"data": {"likes": new_likes}},
            timeout=10
        )
        update_response.raise_for_status()
        
        logger.info(f"Liked song {document_id}: {current_likes} -> {new_likes}")
        
        return {
            "success": True,
            "likes": new_likes
        }
    except Exception as e:
        logger.error(f"Error liking song {document_id}: {e}")
        return {
            "success": False,
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
