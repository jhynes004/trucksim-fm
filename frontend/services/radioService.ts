import axios from 'axios';

const RADIO_BASE_URL = 'https://radio.trucksim.fm:8000';

export interface CurrentSong {
  title?: string;
  artist?: string;
  album?: string;
  rawData?: string;
}

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
    console.log('Current song raw data:', data);
    
    // If it's a string, try to parse it
    if (typeof data === 'string') {
      // Common format: "Artist - Title"
      const parts = data.split(' - ');
      if (parts.length >= 2) {
        return {
          artist: parts[0].trim(),
          title: parts.slice(1).join(' - ').trim(),
          rawData: data,
        };
      }
      return {
        title: data,
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
    console.error('Failed to fetch current song:', error);
    return {
      title: 'TruckSimFM',
      artist: 'Live Radio',
    };
  }
};
