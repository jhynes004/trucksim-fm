import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Default auto-DJ when no live show
const AUTO_DJ = {
  name: 'DJ Cruise Control',
  description: 'Full throttle tunes...',
  showName: 'Auto DJ',
  photoUrl: 'https://trucksim.fm/uploads/DJ_Cruise_Control_62185ad8f6.png',
  isAutoDJ: true,
};

export interface LivePresenter {
  name: string;
  description: string;
  showName: string;
  photoUrl: string | null;
  isAutoDJ: boolean;
  endTime?: string;
}

/**
 * Fetch the current live presenter
 * First tries the dedicated live-presenter endpoint (which checks who played recent songs)
 * Falls back to schedule-based detection if that fails
 */
export const getLivePresenter = async (): Promise<LivePresenter> => {
  try {
    console.log('[PresenterService] Fetching live presenter');
    
    // Try the dedicated live-presenter endpoint first
    const liveResponse = await axios.get(`${BACKEND_URL}/api/live-presenter`, {
      timeout: 10000,
    });
    
    if (liveResponse.data?.success && liveResponse.data?.data) {
      const data = liveResponse.data.data;
      
      console.log('[PresenterService] Got presenter from live-presenter API:', data.name);
      
      return {
        name: data.name || 'DJ Cruise Control',
        description: data.description || '',
        showName: data.show_name || (data.is_auto_dj ? 'Auto DJ' : `Live with ${data.name}`),
        photoUrl: data.photo_url || null,
        isAutoDJ: data.is_auto_dj || false,
      };
    }
    
    console.log('[PresenterService] No data from live-presenter API, returning auto-DJ');
    return AUTO_DJ;
    
  } catch (error) {
    console.error('[PresenterService] Error fetching live presenter:', error);
    return AUTO_DJ;
  }
};
