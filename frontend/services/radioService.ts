import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface CurrentSong {
  title?: string;
  artist?: string;
  album?: string;
  rawData?: string;
}

/**
 * Smart title case that preserves certain patterns
 */
const smartTitleCase = (str: string): string => {
  // Preserve common patterns
  const preservePatterns = ['DJ', 'MC', 'ft', 'feat', 'vs', 'x'];
  
  return str
    .split(' ')
    .map(word => {
      const lower = word.toLowerCase();
      
      // Check if it's a special pattern to preserve
      if (preservePatterns.some(p => lower === p || lower === p + '.')) {
        return lower;
      }
      
      // Handle words with parentheses or brackets
      if (word.includes('(') || word.includes('[')) {
        return word.split(/([(\[])/g).map(part => {
          if (part === '(' || part === '[') return part;
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join('');
      }
      
      // Regular title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Parse artist - title format with all variations
 */
const parseSongString = (text: string): { artist: string; title: string } | null => {
  // Try different separator patterns
  const separators = [' - ', ' – ', ' — ', ' | ', ' / '];
  
  for (const sep of separators) {
    const index = text.indexOf(sep);
    if (index > 0) {
      const artist = text.substring(0, index).trim();
      const title = text.substring(index + sep.length).trim();
      
      if (artist && title) {
        return {
          artist: smartTitleCase(artist),
          title: smartTitleCase(title),
        };
      }
    }
  }
  
  return null;
};

/**
 * Fetch the current playing song from TruckSimFM via backend proxy
 */
export const getCurrentSong = async (): Promise<CurrentSong> => {
  try {
    console.log('[RadioService] Fetching from backend:', `${BACKEND_URL}/api/current-song`);
    
    const response = await axios.get(`${BACKEND_URL}/api/current-song`, {
      timeout: 8000,
    });
    
    console.log('[RadioService] Response:', response.data);
    
    if (!response.data || !response.data.success) {
      throw new Error('Backend returned unsuccessful response');
    }
    
    const songText = response.data.data;
    console.log('[RadioService] Song text:', songText);
    
    if (typeof songText === 'string') {
      const trimmed = songText.trim();
      
      // Try to parse it
      const parsed = parseSongString(trimmed);
      
      if (parsed) {
        console.log('[RadioService] Parsed successfully:', parsed);
        return {
          artist: parsed.artist,
          title: parsed.title,
          rawData: songText,
        };
      }
      
      console.log('[RadioService] Could not parse, returning as title only');
      // If parsing fails, return as title
      return {
        title: smartTitleCase(trimmed),
        artist: 'Unknown Artist',
        rawData: songText,
      };
    }
    
    console.log('[RadioService] Unexpected data format');
    throw new Error('Unexpected data format');
    
  } catch (error) {
    console.error('[RadioService] Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('[RadioService] Axios error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return {
      title: 'TruckSimFM',
      artist: 'Live Radio',
    };
  }
};
