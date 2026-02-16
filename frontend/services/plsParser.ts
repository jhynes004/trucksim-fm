/**
 * Parse .pls playlist files to extract stream URLs
 */
export const parsePlsPlaylist = async (plsUrl: string): Promise<string[]> => {
  try {
    const response = await fetch(plsUrl);
    const plsContent = await response.text();
    
    const urls: string[] = [];
    const lines = plsContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      // Look for File1=, File2=, etc.
      if (trimmedLine.startsWith('File')) {
        const parts = trimmedLine.split('=');
        if (parts.length >= 2) {
          const url = parts.slice(1).join('=').trim(); // Handle URLs with = in them
          if (url) {
            urls.push(decodeURIComponent(url));
          }
        }
      }
    });
    
    console.log('Parsed .pls file, found URLs:', urls);
    return urls;
  } catch (error) {
    console.error('Failed to parse .pls file:', error);
    throw error;
  }
};
