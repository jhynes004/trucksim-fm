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
    
    // The response might be in different formats, let's handle text
    const data = response.data;
    console.log('[RadioService] Current song raw data:', data);
    
    // If it's a string, try to parse it
    if (typeof data === 'string') {
      const trimmed = data.trim();
      
      // Common format: "artist - title" (case-insensitive)
      const dashIndex = trimmed.indexOf(' - ');
      if (dashIndex > 0) {
        const artist = trimmed.substring(0, dashIndex).trim();
        const title = trimmed.substring(dashIndex + 3).trim();
        
        console.log('[RadioService] Parsed - Artist:', artist, 'Title:', title);
        
        return {
          artist: titleCase(artist),
          title: titleCase(title),
          rawData: data,
        };
      }
      
      // If no dash found, return as title
      return {
        title: titleCase(trimmed),
        artist: 'Unknown Artist',
        rawData: data,
      };
    }
    
    // If it's already an object
    return {
      title: data.title || data.song || '',
      artist: data.artist || '',
      album: data.album || '',
      rawData: JSON.stringify(data),
    };
  } catch (error) {
    console.error('[RadioService] Failed to fetch current song:', error);
    return {
      title: 'TruckSimFM',
      artist: 'Live Radio',
    };
  }
};
