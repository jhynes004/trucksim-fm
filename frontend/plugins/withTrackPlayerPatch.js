/**
 * Expo Config Plugin to apply react-native-track-player patches
 * This plugin modifies the native Kotlin source code during prebuild
 */

const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function applyTrackPlayerPatch(projectRoot) {
  const TRACK_PLAYER_FILE = path.join(
    projectRoot,
    'node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt'
  );

  console.log('[TrackPlayerPatch] Checking for MusicModule.kt...');

  if (!fs.existsSync(TRACK_PLAYER_FILE)) {
    console.log('[TrackPlayerPatch] MusicModule.kt not found, skipping');
    return;
  }

  let content = fs.readFileSync(TRACK_PLAYER_FILE, 'utf8');
  
  // Check if already patched
  if (content.includes('val originalItem = musicService.tracks[index].originalItem') &&
      content.includes('mapNotNull { it.originalItem }')) {
    console.log('[TrackPlayerPatch] Already patched, skipping');
    return;
  }

  console.log('[TrackPlayerPatch] Applying Kotlin nullability patches...');

  // Patch 1: Fix getTrack method
  content = content.replace(
    /callback\.resolve\(Arguments\.fromBundle\(musicService\.tracks\[index\]\.originalItem\)\)/g,
    `val originalItem = musicService.tracks[index].originalItem
            if (originalItem != null) {
                callback.resolve(Arguments.fromBundle(originalItem))
            } else {
                callback.resolve(null)
            }`
  );

  // Patch 2: Fix getQueue method
  content = content.replace(
    /callback\.resolve\(Arguments\.fromList\(musicService\.tracks\.map\s*\{\s*it\.originalItem\s*\}\)\)/g,
    'callback.resolve(Arguments.fromList(musicService.tracks.mapNotNull { it.originalItem }))'
  );

  // Patch 3: Fix getActiveTrack method
  content = content.replace(
    /callback\.resolve\(\s*if\s*\(musicService\.tracks\.isEmpty\(\)\)\s*null\s*else\s*Arguments\.fromBundle\(\s*musicService\.tracks\[musicService\.getCurrentTrackIndex\(\)\]\.originalItem\s*\)\s*\)/gs,
    `if (musicService.tracks.isEmpty()) {
            callback.resolve(null)
        } else {
            val originalItem = musicService.tracks[musicService.getCurrentTrackIndex()].originalItem
            if (originalItem != null) {
                callback.resolve(Arguments.fromBundle(originalItem))
            } else {
                callback.resolve(null)
            }
        }`
  );

  fs.writeFileSync(TRACK_PLAYER_FILE, content);
  console.log('[TrackPlayerPatch] Patches applied successfully');
}

const withTrackPlayerPatch = (config) => {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      applyTrackPlayerPatch(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);
};

module.exports = withTrackPlayerPatch;
