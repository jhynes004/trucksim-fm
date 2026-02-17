/**
 * Custom patch script for react-native-track-player
 * This script is designed to run during EAS build to fix Kotlin nullability issues
 * 
 * Run with: node apply-custom-patches.js
 */

const fs = require('fs');
const path = require('path');

const TRACK_PLAYER_FILE = path.join(
  __dirname, 
  'node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt'
);

function applyTrackPlayerPatch() {
  console.log('Applying react-native-track-player Kotlin nullability patches...');
  
  if (!fs.existsSync(TRACK_PLAYER_FILE)) {
    console.log('  MusicModule.kt not found, skipping patch');
    return false;
  }
  
  let content = fs.readFileSync(TRACK_PLAYER_FILE, 'utf8');
  let modified = false;
  
  // Patch 1: Fix getTrack method - line ~548
  // Original: callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem))
  const getTrackPattern = /callback\.resolve\(Arguments\.fromBundle\(musicService\.tracks\[index\]\.originalItem\)\)/g;
  const getTrackReplacement = `val originalItem = musicService.tracks[index].originalItem
            if (originalItem != null) {
                callback.resolve(Arguments.fromBundle(originalItem))
            } else {
                callback.resolve(null)
            }`;
  
  if (getTrackPattern.test(content)) {
    content = content.replace(getTrackPattern, getTrackReplacement);
    modified = true;
    console.log('  Patched getTrack method');
  }
  
  // Patch 2: Fix getQueue method - use mapNotNull
  // Original: callback.resolve(Arguments.fromList(musicService.tracks.map { it.originalItem }))
  const getQueuePattern = /callback\.resolve\(Arguments\.fromList\(musicService\.tracks\.map\s*\{\s*it\.originalItem\s*\}\)\)/g;
  const getQueueReplacement = 'callback.resolve(Arguments.fromList(musicService.tracks.mapNotNull { it.originalItem }))';
  
  if (getQueuePattern.test(content)) {
    content = content.replace(getQueuePattern, getQueueReplacement);
    modified = true;
    console.log('  Patched getQueue method');
  }
  
  // Patch 3: Fix getActiveTrack method - line ~588
  // Original multi-line pattern
  const getActiveTrackPattern = /callback\.resolve\(\s*if\s*\(musicService\.tracks\.isEmpty\(\)\)\s*null\s*else\s*Arguments\.fromBundle\(\s*musicService\.tracks\[musicService\.getCurrentTrackIndex\(\)\]\.originalItem\s*\)\s*\)/gs;
  const getActiveTrackReplacement = `if (musicService.tracks.isEmpty()) {
            callback.resolve(null)
        } else {
            val originalItem = musicService.tracks[musicService.getCurrentTrackIndex()].originalItem
            if (originalItem != null) {
                callback.resolve(Arguments.fromBundle(originalItem))
            } else {
                callback.resolve(null)
            }
        }`;
  
  if (getActiveTrackPattern.test(content)) {
    content = content.replace(getActiveTrackPattern, getActiveTrackReplacement);
    modified = true;
    console.log('  Patched getActiveTrack method');
  }
  
  if (modified) {
    fs.writeFileSync(TRACK_PLAYER_FILE, content);
    console.log('  MusicModule.kt patched successfully');
    return true;
  } else {
    // Check if already patched
    if (content.includes('val originalItem = musicService.tracks[index].originalItem')) {
      console.log('  MusicModule.kt already patched');
      return true;
    }
    console.log('  No patterns matched - file may need manual review');
    return false;
  }
}

// Main execution
console.log('=== Custom Patches for EAS Build ===');
try {
  applyTrackPlayerPatch();
  console.log('=== Patches complete ===');
} catch (error) {
  console.error('Patch error:', error.message);
  // Don't fail the build
  process.exit(0);
}
