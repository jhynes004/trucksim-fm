import axios from 'axios';

const RADIO_BASE_URL = 'https://radio.trucksim.fm:8000';

export interface CurrentSong {
  title?: string;
  artist?: string;
  album?: string;
  rawData?: string;
}

/**
 * Capitalize first letter of each word
 */
const titleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Fetch the current playing song from TruckSimFM
 */
export const getCurrentSong = async (): Promise<CurrentSong> => {
  try {
    const response = await axios.get(`${RADIO_BASE_URL}/currentsong?sid=1`, {
      timeout: 5000,
    });
    
    const data = response.data;
    console.log('[RadioService] Raw response:', JSON.stringify(data));
    console.log('[RadioService] Response type:', typeof data);
    
    // If it's a string, try to parse it
    if (typeof data === 'string') {
      const trimmed = data.trim();
      console.log('[RadioService] Trimmed string:', trimmed);
      
      // Common format: "artist - title" (case-insensitive)
      const dashIndex = trimmed.indexOf(' - ');
      console.log('[RadioService] Dash index:', dashIndex);
      
      if (dashIndex > 0) {
        const artist = trimmed.substring(0, dashIndex).trim();
        const title = trimmed.substring(dashIndex + 3).trim();
        
        console.log('[RadioService] Parsed - Artist:', artist, 'Title:', title);
        
        const result = {
          artist: titleCase(artist),
          title: titleCase(title),
          rawData: data,
        };
        
        console.log('[RadioService] Final result:', result);
        return result;
      }
      
      console.log('[RadioService] No dash found, returning as title only');
      // If no dash found, return as title
      return {
        title: titleCase(trimmed),
        artist: 'Unknown Artist',
        rawData: data,
      };
    }
    
    console.log('[RadioService] Data is object, not string');
    // If it's already an object
    return {
      title: data.title || data.song || '',
      artist: data.artist || '',
      album: data.album || '',
      rawData: JSON.stringify(data),
    };
  } catch (error) {
    console.error('[RadioService] Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('[RadioService] Axios error:', error.message, error.response?.status);
    }
    return {
      title: 'TruckSimFM',
      artist: 'Live Radio',
    };
  }
};
