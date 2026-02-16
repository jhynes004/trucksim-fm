# TruckSimFM Radio App - Product Requirements Document

## Original Problem Statement
Build a mobile application for the online radio station `trucksim.fm`.

## Architecture
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: FastAPI (Python) as BFF proxy
- **Database**: None (uses external APIs)
- **Key Libraries**: expo-av, expo-router, react-native-reanimated, react-native-webview, expo-haptics

## What's Been Implemented

### Core Features
1. **Radio Tab**: Live streaming with spinning turntable, Spotify album art integration, live presenter display
2. **Request Tab**: Dropdown for Song Request, Shout-out, Competition Entry with WhatsApp integration
3. **Schedule Tab**: Day-based filtering with proper UTC handling
4. **Stats Tab**: WebView embedding radiostats.info
5. **Socials Tab**: Links to WhatsApp, Discord, Facebook, X with official logos
6. **Branding**: Custom app icon and splash screen

### Additional Features
- **Sleep Timer**: Moon icon with countdown, auto-stops playback
- **Recently Played**: Shows last 5 songs with artwork and like counts
- **Live Presenter**: Schedule-based detection with priority sorting
- **Custom Tab Icons**: Radio, Mail, Calendar, Chart, Person silhouette

### Custom Assets
- `/app/frontend/assets/images/placeholder-album.png` - Album art placeholder
- `/app/frontend/assets/images/moon-icon.png` - Sleep timer icon
- `/app/frontend/assets/images/socials-icon.png` - Socials tab icon

## API Endpoints
- `GET /api/current-song` - Current playing song
- `GET /api/schedule` - TruckSimFM schedule data
- `GET /api/recently-played?limit=5` - Recently played tracks with likes
- `GET /api/live-presenter` - Current live presenter
- `POST /api/spotify/search` - Spotify track metadata

## File Summary
- `/app/frontend/app/(tabs)/radio.tsx` - Main radio player with turntable
- `/app/frontend/app/(tabs)/request.tsx` - Song request form
- `/app/frontend/app/(tabs)/schedule.tsx` - Show schedule by day
- `/app/frontend/app/(tabs)/stats.tsx` - Stats WebView
- `/app/frontend/app/(tabs)/socials.tsx` - Social media links
- `/app/frontend/app/(tabs)/_layout.tsx` - Tab navigation with custom icons
- `/app/frontend/services/presenterService.ts` - Live presenter detection
- `/app/frontend/services/recentlyPlayedService.ts` - Recently played tracks
- `/app/backend/server.py` - FastAPI backend

## Deployment
- Backend: Deployed via Emergent
- Frontend: Build with EAS CLI locally
- See `/app/DEPLOYMENT.md` for instructions

## App Ready Status: ✅ COMPLETE
All requested features implemented and tested.
