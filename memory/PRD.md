# TruckSim.FM Mobile App - PRD

## Original Problem Statement
Build a mobile application for the online radio station `trucksim.fm` with:
- Live audio streaming with background playback and notification controls (like Spotify)
- Now Playing information from the radio stream
- Live presenter/DJ display
- Spotify album art integration
- Turntable UI with spinning animation
- Song requests via WhatsApp
- Schedule display
- Recently played songs
- Sleep timer
- Social media links

## User Preferences
- Language: English
- Presenter detection: Use schedule API (user confirmed working)
- Icons: Custom icons provided by user (keep as-is)
- Haptic feedback: Working (no changes needed)

## Tech Stack
- **Frontend**: React Native with Expo SDK 54, expo-router
- **Backend**: FastAPI (Python)
- **Audio**: react-native-track-player (for background playback + notification controls)
- **Building**: EAS (Expo Application Services)

## What's Been Implemented
- [x] Core audio streaming
- [x] Now Playing data from radio stream
- [x] Spotify album art integration
- [x] Turntable UI with rotation animation
- [x] Live presenter detection (from schedule API)
- [x] Recently played songs list
- [x] Sleep timer functionality
- [x] Social media tab with links
- [x] Song request UI (WhatsApp integration)
- [x] Schedule display
- [x] Custom icons (moon, socials, tab icons)
- [x] Haptic feedback on buttons
- [x] SafeAreaView for device notch/navigation handling

## Latest Update (December 2025)
### Background Audio Implementation Complete
Fixed background audio playback with notification/lock-screen controls:

1. **Added `expo-build-properties` plugin** to `app.json`:
   - iOS: `usesAudioBackgroundMode: true`
   - Android: `usesCleartextTraffic: true`

2. **Created dedicated `playbackService.js`** for background event handling:
   - Handles RemotePlay, RemotePause, RemoteStop events
   - Handles audio interruptions (RemoteDuck)
   - Handles playback errors and state changes

3. **Updated `trackPlayerService.ts`** with proper Android config:
   - `appKilledPlaybackBehavior: ContinuePlayback`
   - `stoppingAppPausesPlayback: false`
   - Notification capabilities: Play, Pause, Stop

4. **Updated `index.js`** entry point:
   - Registers playback service before React renders

## Next Steps for User
**CRITICAL: A new APK build is required to test background audio.**

To test the background audio fix:
1. Run `eas build --profile development --platform android`
2. Install the new APK on your device
3. Play the stream and:
   - Lock your phone - music should continue
   - Check notification shade - should show TruckSimFM with Play/Pause controls
   - Swipe away the app - music should continue
   - Use notification controls to pause/play

## Files Modified This Session
- `/app/frontend/app.json` - Added expo-build-properties plugin
- `/app/frontend/services/trackPlayerService.ts` - Enhanced Android config
- `/app/frontend/services/playbackService.js` - New dedicated background service
- `/app/frontend/index.js` - Updated service registration
- `/app/frontend/package.json` - Added expo-build-properties dependency

## API Endpoints
- `GET /api/current_song` - Current song info
- `GET /api/schedule` - Schedule data
- `GET /api/spotify_search` - Album art lookup
- `GET /api/recently_played` - Recently played tracks

## External Services
- TruckSim.FM Radio Stream: `https://radio.trucksim.fm:8000/radio.mp3`
- TruckSim.FM API: `https://radio.trucksim.fm:8000/currentsong?sid=1`
- Spotify Web API (for album art)

## Known Limitations
- "Liking" songs not possible (API returns 403 Forbidden) - display-only mode implemented
- X/Twitter link: Fix implemented, pending user verification in new APK build

## Backlog
- [ ] User verification of background audio in APK build
- [ ] User verification of X/Twitter link in APK build
- [ ] App store deployment guidance (when ready)
