import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

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
    const response = await axios.post(
      `${BACKEND_URL}/api/spotify/search`,
      { artist, title },
      { timeout: 10000 }
    );
    
    console.log('Spotify search result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to search Spotify:', error);
    return null;
  }
};
