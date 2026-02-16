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
- **Key Libraries**: expo-av, expo-router, react-native-reanimated, react-native-webview, spotipy

## What's Been Implemented

### Core Features (Completed)
1. **Radio Tab**: Live streaming with spinning turntable, Spotify album art integration
2. **Request Tab**: Dropdown for Song Request, Shout-out, Competition Entry with WhatsApp integration
3. **Schedule Tab**: Day-based filtering of shows from trucksim.fm API
4. **Stats Tab**: WebView embedding radiostats.info
5. **Socials Tab**: Links to WhatsApp, Discord, Facebook, X with official logos
6. **Branding**: Custom app icon and splash screen

### Polish Items (Session Feb 16, 2026)
1. **Safe Area Navigation Fix**: All tabs now use `useSafeAreaInsets()` to prevent content from being hidden behind device navigation bars
2. **Live Presenter Feature**: New `presenterService.ts` displays current DJ or "DJ Cruise Control" (auto-DJ) based on schedule data
3. **Placeholder Album Art**: TSFM logo displayed on turntable before Spotify art loads

## Files Modified (Feb 16, 2026)
- `/app/frontend/app/(tabs)/_layout.tsx` - Added safe area insets for tab bar
- `/app/frontend/app/(tabs)/radio.tsx` - Added live presenter banner, placeholder image, safe area padding
- `/app/frontend/app/(tabs)/request.tsx` - Added safe area padding
- `/app/frontend/app/(tabs)/schedule.tsx` - Added safe area padding
- `/app/frontend/app/(tabs)/socials.tsx` - Added safe area padding
- `/app/frontend/app/(tabs)/stats.tsx` - Added safe area padding
- `/app/frontend/services/presenterService.ts` - NEW: Service to fetch live presenter from schedule

## API Endpoints
- `GET /api/current-song` - Proxies TruckSimFM current song
- `GET /api/schedule` - Proxies TruckSimFM schedule with presenter data
- `POST /api/spotify/search` - Searches Spotify for track metadata

## Remaining Tasks

### P0 - Blockers
- User needs to build APK/IPA on local machine (agent cannot build in this environment)

### P1 - Should Have
- None

### P2 - Nice to Have
- Font loading error investigation (Ionicons.ttf early warning)
- Add haptic feedback on button presses

## Deployment Notes
- Backend deployed at: https://trucksim-radio-1.preview.emergentagent.com
- EAS configured in `/app/frontend/eas.json`
- User must run `eas build` on their local machine with EAS CLI
- See `/app/DEPLOYMENT.md` for detailed instructions
