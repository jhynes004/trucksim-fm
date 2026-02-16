# TruckSimFM Radio App - Product Requirements Document

## Original Problem Statement
Build a mobile application for the online radio station `trucksim.fm`.

## Architecture
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: FastAPI (Python) as BFF proxy
- **Database**: None (uses external APIs)
- **Key Libraries**: expo-av, expo-router, react-native-reanimated, react-native-webview, expo-haptics

## What's Been Implemented

### Core Features (Completed)
1. **Radio Tab**: Live streaming with spinning turntable, Spotify album art integration
2. **Request Tab**: Dropdown for Song Request, Shout-out, Competition Entry with WhatsApp integration
3. **Schedule Tab**: Day-based filtering with proper UTC handling
4. **Stats Tab**: WebView embedding radiostats.info
5. **Socials Tab**: Links to WhatsApp, Discord, Facebook, X with official logos
6. **Branding**: Custom app icon and splash screen

### Session Feb 16, 2026 - Fixes & Enhancements

#### 1. Safe Area & Tab Bar Fix
- All tabs use `useSafeAreaInsets()` to prevent content being hidden by device navigation
- Tab bar height dynamically adjusts

#### 2. Live Presenter Detection (Fixed)
- Uses UTC time consistently
- Permanent shows: Match day-of-week and time, respect `perm_end` dates
- One-time shows: Only match if scheduled for TODAY (exact date match)
- Shows "DJ Cruise Control" as auto-DJ when no show is live

#### 3. Schedule Improvements
- Fixed duplicate show entries
- Uses UTC consistently (`getUTCDay()`, `getUTCHours()`, etc.)
- Proper handling of `perm_end` - skips shows that have ended
- One-time shows override permanent shows for the same time slot
- Shows sorted by start time

#### 4. Custom Placeholder Album Art
- User-provided logo at `/app/frontend/assets/images/placeholder-album.png`
- Displayed on turntable when no Spotify art available
- Also used in recently played section

#### 5. Sleep Timer
- Modal with options: 5, 15, 30, 45, 60, 90 minutes
- Moon icon displays next to LIVE indicator when playing
- Countdown shown when timer active
- Auto-stops playback when timer expires
- Haptic feedback when timer completes

#### 6. Updated Tab Icons
- Radio tab: Vintage radio icon with antenna and dial
- Request tab: Mail/envelope icon

#### 7. Like Count Display
- Shows existing like count on recently played tracks (read-only)
- Note: TruckSimFM API doesn't allow external writes (403 Forbidden)

#### 8. Haptic Feedback
- Added `expo-haptics` calls to all interactive elements
- Note: Works on physical devices only, not simulators

## API Endpoints
- `GET /api/current-song` - Proxies TruckSimFM current song
- `GET /api/schedule` - Proxies TruckSimFM schedule with presenter data
- `POST /api/spotify/search` - Searches Spotify for track metadata
- `GET /api/recently-played?limit=5` - Returns recently played songs

## Known Limitations

### Live Presenter
The TruckSimFM schedule data includes historical shows. The current implementation:
1. Filters permanent shows by `perm_end` date
2. Only matches one-time shows for TODAY
3. Cannot detect live DJs outside of scheduled times

### Like Feature
TruckSimFM's API returns 403 Forbidden for PUT requests, so we can only display existing like counts, not add new likes.

### Haptic Feedback
`expo-haptics` only works on physical devices. Simulators/emulators don't support haptic feedback.

## Remaining Tasks

### P0 - Blockers
- Build APK/IPA on user's local machine

### P2 - Nice to Have  
- Real-time presenter detection API (if TruckSimFM exposes one)

## File Changes (Feb 16, 2026)
- `/app/frontend/services/presenterService.ts` - Fixed UTC handling, perm_end checks
- `/app/frontend/app/(tabs)/schedule.tsx` - Fixed deduplication, UTC day matching, perm_end
- `/app/frontend/app/(tabs)/radio.tsx` - Sleep timer, placeholder image, read-only likes
- `/app/frontend/app/(tabs)/_layout.tsx` - Updated tab icons
- `/app/frontend/assets/images/placeholder-album.png` - User-provided image
