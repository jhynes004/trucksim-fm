import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface RecentlyPlayedTrack {
  id: number;
  documentId: string;
  artist: string;
  song: string;
  artwork_url: string | null;
  played_at: string;
  likes: number;
}

/**
 * Fetch recently played tracks from the TruckSimFM playlist
 */
export const getRecentlyPlayed = async (limit: number = 5): Promise<RecentlyPlayedTrack[]> => {
  try {
    console.log('[RecentlyPlayedService] Fetching recently played tracks');
    
    const response = await axios.get(`${BACKEND_URL}/api/recently-played`, {
      params: { limit },
      timeout: 10000,
    });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log(`[RecentlyPlayedService] Fetched ${response.data.data.length} tracks`);
      return response.data.data;
    }
    
    console.log('[RecentlyPlayedService] Invalid response, returning empty array');
    return [];
    
  } catch (error) {
    console.error('[RecentlyPlayedService] Error fetching recently played:', error);
    return [];
  }
};

/**
 * Like a song on TruckSimFM
 */
export const likeSong = async (documentId: string): Promise<{ success: boolean; likes?: number }> => {
  try {
    console.log('[RecentlyPlayedService] Liking song:', documentId);
    
    const response = await axios.post(`${BACKEND_URL}/api/like-song/${documentId}`, {}, {
      timeout: 10000,
    });
    
    if (response.data && response.data.success) {
      console.log('[RecentlyPlayedService] Song liked successfully, new count:', response.data.likes);
      return { success: true, likes: response.data.likes };
    }
    
    return { success: false };
    
  } catch (error) {
    console.error('[RecentlyPlayedService] Error liking song:', error);
    return { success: false };
  }
};

/**
 * Format the played time as a relative string (e.g., "2 min ago")
 */
export const formatPlayedTime = (isoTime: string): string => {
  const played = new Date(isoTime);
  const now = new Date();
  const diffMs = now.getTime() - played.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
};
