import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export interface SpotifyTrack {
  title?: string;
  artist?: string;
  album?: string;
  album_art_url?: string;
  album_art_small?: string;
  album_art_medium?: string;
  release_date?: string;
  spotify_url?: string;
  duration_ms?: number;
  preview_url?: string;
}

/**
 * Search for a track on Spotify via our backend
 */
export const searchSpotifyTrack = async (
  artist: string,
  title: string
): Promise<SpotifyTrack | null> => {
  try {
    console.log('[SpotifyService] Searching with backend URL:', BACKEND_URL);
    console.log('[SpotifyService] Artist:', artist, 'Title:', title);
    
    const response = await axios.post(
      `${BACKEND_URL}/api/spotify/search`,
      { artist, title },
      { timeout: 10000 }
    );
    
    console.log('[SpotifyService] Spotify search result:', response.data);
    
    // Check if we got valid data
    if (response.data && response.data.album_art_url) {
      return response.data;
    }
    
    console.log('[SpotifyService] No album art in response');
    return null;
  } catch (error) {
    console.error('[SpotifyService] Failed to search Spotify:', error);
    if (axios.isAxiosError(error)) {
      console.error('[SpotifyService] Axios error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }
    return null;
  }
};
