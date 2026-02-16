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

### Session Feb 16, 2026 - Part 1 (Safe Area Fix)
1. **Safe Area Navigation Fix**: All tabs now use `useSafeAreaInsets()` to prevent content from being hidden behind device navigation bars
2. **Placeholder Album Art**: TruckSimFM logo displayed on turntable before Spotify art loads

### Session Feb 16, 2026 - Part 2 (Enhancements)
1. **Live Presenter Feature**: Created `presenterService.ts` that calculates the current live DJ based on schedule data and UTC time comparison. Shows "DJ Cruise Control" when no show is live.
2. **Recently Played Section**: Added `recentlyPlayedService.ts` and backend endpoint `/api/recently-played` that fetches the last 5 played songs with album art from the TruckSimFM playlist API.
3. **Haptic Feedback**: Added `expo-haptics` to play/stop button, request form submit, clear form, and social links for tactile feedback on button presses.

## Files Modified (Feb 16, 2026 - Part 2)
- `/app/backend/server.py` - Added `/api/recently-played` endpoint
- `/app/frontend/services/presenterService.ts` - NEW: Live presenter detection from schedule
- `/app/frontend/services/recentlyPlayedService.ts` - NEW: Recently played tracks service
- `/app/frontend/app/(tabs)/radio.tsx` - Added presenter banner, recently played section, haptics, ScrollView
- `/app/frontend/app/(tabs)/request.tsx` - Added haptic feedback on submit and clear
- `/app/frontend/app/(tabs)/socials.tsx` - Added haptic feedback on social link clicks

## API Endpoints
- `GET /api/current-song` - Proxies TruckSimFM current song
- `GET /api/schedule` - Proxies TruckSimFM schedule with presenter data
- `POST /api/spotify/search` - Searches Spotify for track metadata
- `GET /api/recently-played?limit=5` - Returns recently played songs with artwork

## How Live Presenter Detection Works
The presenter service:
1. Fetches the schedule data from `/api/schedule`
2. For each permanent (recurring) show, checks if:
   - The day of week matches (using `getUTCDay()`: 0=Sun, 1=Mon, etc.)
   - The current UTC time is within the show's time slot
3. If a match is found, returns the presenter's username and show name
4. If no show is live, returns "DJ Cruise Control" as the auto-DJ

## Remaining Tasks

### P0 - Blockers
- User needs to build APK/IPA on local machine (agent cannot build in this environment)

### P1 - Should Have
- None

### P2 - Nice to Have
- Font loading error investigation (Ionicons.ttf early warning)

## Deployment Notes
- Backend deployed at: https://trucksim-radio-1.preview.emergentagent.com
- EAS configured in `/app/frontend/eas.json`
- User must run `eas build` on their local machine with EAS CLI
- See `/app/DEPLOYMENT.md` for detailed instructions

## Testing Notes
Since this is a React Native/Expo app, browser-based testing isn't possible. The user must test on their physical device via:
1. Expo Go app (development)
2. APK/IPA build (production)
