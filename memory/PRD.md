# TruckSimFM Radio App - Product Requirements Document

## Original Problem Statement
Build a mobile application for the online radio station `trucksim.fm` with the following features:
- **Streaming**: Listen to the live stream from `https://radio.trucksim.fm:8000/radio.mp3`
- **Now Playing**: Fetch the current song from `https://radio.trucksim.fm:8000/currentsong?sid=1`
- **Spotify Integration**: Use Spotify API to get album art and metadata for the currently playing song
- **Turntable UI**: Display the album art on a spinning turntable animation
- **Song Requests**: Native UI to handle song requests via WhatsApp with dropdown for different request types
- **Schedule**: Native UI to display the show schedule
- **Listener Stats**: A tab that embeds `https://radiostats.info` in a WebView
- **Socials Tab**: A tab with links and logos for WhatsApp, Discord, Facebook, and X (Twitter)
- **Branding**: The app's color scheme, logo, icon, and splash screen should match the `trucksim.fm` branding
- **Navigation**: Tab-based navigation structure
- **Deployment**: Prepare for app store deployment

## Architecture
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: FastAPI (Python) as BFF proxy
- **Database**: None (uses external APIs)
- **Key Libraries**: expo-av, expo-router, react-native-reanimated, react-native-webview, expo-haptics, spotipy

## What's Been Implemented

### Core Features (Completed)
1. **Radio Tab**: Live streaming with spinning turntable, Spotify album art integration
2. **Request Tab**: Dropdown for Song Request, Shout-out, Competition Entry with WhatsApp integration
3. **Schedule Tab**: Day-based filtering of shows from trucksim.fm API
4. **Stats Tab**: WebView embedding radiostats.info
5. **Socials Tab**: Links to WhatsApp, Discord, Facebook, X with official logos
6. **Branding**: Custom app icon and splash screen

### Session Feb 16, 2026 - Major Enhancements

#### 1. Safe Area & Navigation Fixes
- All tabs now use `useSafeAreaInsets()` to prevent content from being hidden behind device navigation bars
- Tab bar height dynamically adjusts based on device safe area

#### 2. Live Presenter Feature (Fixed)
- Created `presenterService.ts` with UTC time matching
- Now properly distinguishes between permanent (recurring) and one-time shows
- For one-time shows: Only matches if the show date is TODAY
- For permanent shows: Matches day-of-week and time slot
- Falls back to "DJ Cruise Control" when no show is live

#### 3. Schedule Tab Improvements
- Fixed duplicate show entries by using a Map with unique keys
- Proper UTC time handling for day-of-week matching
- One-time shows properly override permanent shows for the same time slot
- Shows sorted by start time

#### 4. Placeholder Album Art
- User-provided logo saved to `/app/frontend/assets/images/placeholder-album.png`
- Displayed on turntable when no Spotify album art is available
- Also used in recently played section when tracks lack artwork

#### 5. Sleep Timer
- Modal with options: 5, 15, 30, 45, 60, 90 minutes
- Countdown displayed next to a moon icon
- Automatically stops playback when timer expires
- Can cancel timer by tapping again
- Haptic feedback when timer completes

#### 6. Like/Favorite Button
- Each recently played track has a 👍 button
- Calls `/api/like-song/{documentId}` to increment likes on TruckSimFM
- Prevents double-liking in the same session
- Shows updated like count after liking

#### 7. Updated Tab Icons
- Radio tab: Vintage radio icon with antenna and dial
- Request tab: Mail/envelope icon

#### 8. Haptic Feedback
- Play/Stop button: Medium impact + success/error notification
- Sleep timer selection: Medium impact
- Sleep timer cancel: Light impact
- Like button: Light impact + success notification
- Request form submit/clear: Medium/Light impact
- Social links: Medium impact

## Files Modified (Feb 16, 2026)
- `/app/backend/server.py` - Added `/api/recently-played` with documentId, `/api/like-song/{documentId}` endpoint
- `/app/frontend/services/presenterService.ts` - Fixed UTC time matching, separate logic for permanent vs one-time shows
- `/app/frontend/services/recentlyPlayedService.ts` - Added `likeSong()` function, `documentId` field
- `/app/frontend/app/(tabs)/radio.tsx` - Added sleep timer, like button, placeholder image
- `/app/frontend/app/(tabs)/schedule.tsx` - Fixed deduplication and UTC day matching
- `/app/frontend/app/(tabs)/_layout.tsx` - Updated Radio and Request tab icons
- `/app/frontend/assets/images/placeholder-album.png` - User-provided placeholder image

## API Endpoints
- `GET /api/current-song` - Proxies TruckSimFM current song
- `GET /api/schedule` - Proxies TruckSimFM schedule with presenter data
- `POST /api/spotify/search` - Searches Spotify for track metadata
- `GET /api/recently-played?limit=5` - Returns recently played songs with documentId for liking
- `POST /api/like-song/{documentId}` - Increments like count on TruckSimFM

## Known Issue: Live Presenter Detection
The TruckSimFM website appears to use a separate "live now" indicator that may differ from schedule data. The current implementation relies solely on schedule matching. If a DJ goes live outside their scheduled time, or extends beyond it, the app won't reflect this. A more accurate solution would require access to TruckSimFM's real-time "now playing" DJ endpoint if one exists.

## Remaining Tasks

### P0 - Blockers
- User needs to build APK/IPA on local machine

### P2 - Nice to Have
- Real-time presenter detection (if TruckSimFM exposes API)
- Font loading error investigation

## Deployment Notes
- Backend deployed at: https://trucksim-radio-1.preview.emergentagent.com
- EAS configured in `/app/frontend/eas.json`
- User must run `eas build` on their local machine with EAS CLI
- See `/app/DEPLOYMENT.md` for detailed instructions
