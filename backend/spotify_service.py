import os
import requests
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class SpotifyService:
    def __init__(self):
        self.client_id = os.environ.get('SPOTIFY_CLIENT_ID')
        self.client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET')
        self.access_token = None
        self.token_expires_at = None
        logger.info(f'Spotify service initialized. Client ID length: {len(self.client_id) if self.client_id else 0}')
        
    def _get_access_token(self) -> str:
        """Get Spotify access token using client credentials flow"""
        # Check if we have a valid token
        if self.access_token and self.token_expires_at:
            if datetime.now() < self.token_expires_at:
                return self.access_token
        
        # Get new token using Basic Auth
        auth_url = 'https://accounts.spotify.com/api/token'
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        auth_data = {
            'grant_type': 'client_credentials'
        }
        
        try:
            # Use Basic Auth with client_id and client_secret
            from requests.auth import HTTPBasicAuth
            response = requests.post(
                auth_url, 
                headers=headers,
                data=auth_data, 
                auth=HTTPBasicAuth(self.client_id, self.client_secret),
                timeout=10
            )
            response.raise_for_status()
            token_data = response.json()
            
            self.access_token = token_data['access_token']
            # Token expires in seconds, store expiry time with 5 min buffer
            expires_in = token_data.get('expires_in', 3600)
            self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 300)
            
            logger.info('Successfully obtained Spotify access token')
            return self.access_token
            
        except Exception as e:
            logger.error(f'Failed to get Spotify access token: {e}')
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f'Response content: {e.response.text}')
            raise
    
    def search_track(self, artist: str, title: str) -> Optional[Dict[str, Any]]:
        """Search for a track on Spotify and return metadata including album art"""
        if not artist or not title:
            logger.warning('Artist or title is missing')
            return None
            
        try:
            token = self._get_access_token()
            
            # Create search query
            query = f'artist:{artist} track:{title}'
            search_url = 'https://api.spotify.com/v1/search'
            headers = {'Authorization': f'Bearer {token}'}
            params = {
                'q': query,
                'type': 'track',
                'limit': 1
            }
            
            response = requests.get(search_url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            tracks = data.get('tracks', {}).get('items', [])
            if not tracks:
                logger.info(f'No Spotify results found for: {artist} - {title}')
                return None
            
            track = tracks[0]
            album = track.get('album', {})
            images = album.get('images', [])
            
            # Get the highest quality image (first in array)
            album_art_url = images[0]['url'] if images else None
            
            result = {
                'title': track.get('name'),
                'artist': ', '.join([a['name'] for a in track.get('artists', [])]),
                'album': album.get('name'),
                'album_art_url': album_art_url,
                'album_art_small': images[-1]['url'] if images else None,  # Smallest image
                'album_art_medium': images[1]['url'] if len(images) > 1 else album_art_url,
                'release_date': album.get('release_date'),
                'spotify_url': track.get('external_urls', {}).get('spotify'),
                'duration_ms': track.get('duration_ms'),
                'preview_url': track.get('preview_url')
            }
            
            logger.info(f'Found Spotify match for: {artist} - {title}')
            return result
            
        except Exception as e:
            logger.error(f'Error searching Spotify: {e}')
            return None

# Create a singleton instance
spotify_service = SpotifyService()
