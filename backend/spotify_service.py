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
        
        if not self.client_id or not self.client_secret:
            logger.error('Spotify credentials not found in environment variables')
        else:
            logger.info(f'Spotify service initialized successfully')
        
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
    
    def _clean_search_term(self, term: str) -> str:
        """Clean search term by removing common extras and special characters"""
        import re
        # Remove content in parentheses or brackets (e.g., "(feat. ...)", "[Remix]")
        term = re.sub(r'\([^)]*\)', '', term)
        term = re.sub(r'\[[^\]]*\]', '', term)
        # Remove common suffixes
        term = re.sub(r'\s*-\s*(Official|Lyric|Music)?\s*(Video|Audio|Mix|Remix|Version).*$', '', term, flags=re.IGNORECASE)
        # Remove extra whitespace
        term = ' '.join(term.split())
        return term.strip()
    
    def _search_with_query(self, token: str, query: str, limit: int = 1) -> Optional[Dict[str, Any]]:
        """Perform a single Spotify search with the given query"""
        search_url = 'https://api.spotify.com/v1/search'
        headers = {'Authorization': f'Bearer {token}'}
        params = {
            'q': query,
            'type': 'track',
            'limit': limit
        }
        
        try:
            response = requests.get(search_url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            tracks = data.get('tracks', {}).get('items', [])
            if tracks:
                track = tracks[0]
                album = track.get('album', {})
                images = album.get('images', [])
                
                # Get the highest quality image (first in array)
                album_art_url = images[0]['url'] if images else None
                
                return {
                    'title': track.get('name'),
                    'artist': ', '.join([a['name'] for a in track.get('artists', [])]),
                    'album': album.get('name'),
                    'album_art_url': album_art_url,
                    'album_art_small': images[-1]['url'] if images else None,
                    'album_art_medium': images[1]['url'] if len(images) > 1 else album_art_url,
                    'release_date': album.get('release_date'),
                    'spotify_url': track.get('external_urls', {}).get('spotify'),
                    'duration_ms': track.get('duration_ms'),
                    'preview_url': track.get('preview_url'),
                    '_all_results': tracks  # Store all results for validation
                }
            return None
        except Exception as e:
            logger.error(f'Error in Spotify search query "{query}": {e}')
            return None
    
    def _validate_match(self, result: Dict[str, Any], original_artist: str, original_title: str) -> bool:
        """Validate if a Spotify result is likely a correct match"""
        if not result:
            return False
        
        import re
        
        # Normalize strings for comparison
        def normalize(s: str) -> str:
            s = s.lower()
            # Remove common separators and special chars
            s = re.sub(r'[&,x\-\+\(\)\[\]\'"]', ' ', s)
            # Remove extra whitespace
            s = ' '.join(s.split())
            return s
        
        result_title = normalize(result.get('title', ''))
        result_artist = normalize(result.get('artist', ''))
        search_title = normalize(original_title)
        search_artist = normalize(original_artist)
        
        # Check if the title matches (at least 80% of words)
        title_words = set(search_title.split())
        result_title_words = set(result_title.split())
        
        if title_words and result_title_words:
            title_overlap = len(title_words & result_title_words) / len(title_words)
            if title_overlap < 0.5:  # Less than 50% overlap is suspicious
                logger.info(f"Title match low: {title_overlap:.0%} overlap")
                return False
        
        # Check if artist appears in result
        artist_words = set(search_artist.split())
        result_artist_words = set(result_artist.split())
        
        if artist_words and result_artist_words:
            artist_overlap = len(artist_words & result_artist_words) / len(artist_words)
            if artist_overlap < 0.3:  # Less than 30% overlap might be wrong
                logger.info(f"Artist match low: {artist_overlap:.0%} overlap")
                # Don't reject, but log it
        
        return True
    
    def search_track(self, artist: str, title: str) -> Optional[Dict[str, Any]]:
        """Search for a track on Spotify with multiple fallback strategies"""
        if not artist or not title:
            logger.warning('Artist or title is missing')
            return None
            
        try:
            token = self._get_access_token()
            
            # Clean the search terms
            clean_artist = self._clean_search_term(artist)
            clean_title = self._clean_search_term(title)
            
            # Strategy 1: Strict search with artist and track fields
            logger.info(f'Trying strict search: artist:"{clean_artist}" track:"{clean_title}"')
            query = f'artist:"{clean_artist}" track:"{clean_title}"'
            result = self._search_with_query(token, query)
            if result and self._validate_match(result, artist, title):
                logger.info(f'✓ Found match with strict search for: {artist} - {title}')
                # Remove internal data before returning
                result.pop('_all_results', None)
                return result
            
            # Strategy 2: Less strict with unquoted terms
            logger.info(f'Trying unquoted search: artist:{clean_artist} track:{clean_title}')
            query = f'artist:{clean_artist} track:{clean_title}'
            result = self._search_with_query(token, query)
            if result and self._validate_match(result, artist, title):
                logger.info(f'✓ Found match with unquoted search for: {artist} - {title}')
                result.pop('_all_results', None)
                return result
            
            # Strategy 3: General search with both terms (no field specifiers)
            logger.info(f'Trying general search: {clean_artist} {clean_title}')
            query = f'{clean_artist} {clean_title}'
            result = self._search_with_query(token, query, limit=5)
            if result and self._validate_match(result, artist, title):
                logger.info(f'✓ Found match with general search for: {artist} - {title}')
                result.pop('_all_results', None)
                return result
            
            # Strategy 4: Search with original (uncleaned) terms
            if clean_artist != artist or clean_title != title:
                logger.info(f'Trying original terms: {artist} {title}')
                query = f'{artist} {title}'
                result = self._search_with_query(token, query, limit=5)
                if result and self._validate_match(result, artist, title):
                    logger.info(f'✓ Found match with original terms for: {artist} - {title}')
                    result.pop('_all_results', None)
                    return result
            
            # Strategy 5: Try just the track title (for cases where artist might be wrong/misspelled)
            logger.info(f'Trying title-only search: {clean_title}')
            query = f'track:"{clean_title}"'
            result = self._search_with_query(token, query, limit=5)
            if result and self._validate_match(result, artist, title):
                logger.info(f'✓ Found match with title-only search for: {artist} - {title}')
                result.pop('_all_results', None)
                return result
            
            logger.warning(f'✗ No Spotify results found after all strategies for: {artist} - {title}')
            return None
            
        except Exception as e:
            logger.error(f'Error searching Spotify: {e}')
            return None

# Create a singleton instance
spotify_service = SpotifyService()
