# TruckSim FM - Deployment Guide

## 📱 App Information

**App Name:** TruckSim FM
**Version:** 1.0.0
**Bundle ID (iOS):** fm.trucksim.app
**Package Name (Android):** fm.trucksim.app

---

## ✅ Pre-Deployment Checklist

### Completed:
- ✅ Updated `app.json` with production configuration
- ✅ Set proper app name: "TruckSim FM"
- ✅ Set bundle identifiers for iOS and Android
- ✅ Configured dark mode UI
- ✅ Added Android permissions
- ✅ Added iOS privacy descriptions
- ✅ Created `eas.json` for Expo Application Services builds

### Still Needed:
- ⚠️ **App Icon** - Create 1024x1024px icon and place in `assets/images/icon.png`
- ⚠️ **Splash Screen** - Update `assets/images/splash-icon.png` with TruckSim FM logo
- ⚠️ **Adaptive Icon (Android)** - Update `assets/images/adaptive-icon.png`
- ⚠️ **Favicon** - Update `assets/images/favicon.png` for web version

---

## 🚀 Deployment Steps

### Part 1: Backend Deployment (via Emergent)

1. **Deploy Backend:**
   - In Emergent interface, click the **Deploy** button
   - This will deploy your FastAPI backend to production
   - You'll receive a production backend URL

2. **Update Frontend Environment:**
   - After backend deployment, update `/app/frontend/.env`:
   ```
   EXPO_PUBLIC_BACKEND_URL=https://your-production-backend-url.com
   ```

3. **Important Backend Files:**
   - `/app/backend/server.py` - Main FastAPI application
   - `/app/backend/spotify_service.py` - Spotify API integration
   - `/app/backend/.env` - Contains Spotify credentials (keep secure!)
   - `/app/backend/requirements.txt` - Python dependencies

---

### Part 2: Mobile App Build & Deployment

#### Prerequisites:
```bash
# Install Expo CLI globally (if not already installed)
npm install -g eas-cli

# Login to your Expo account
eas login

# Navigate to frontend directory
cd /app/frontend
```

#### Option A: Build APK for Android (Direct Distribution)

1. **Configure EAS Project:**
```bash
eas build:configure
```
   - This will prompt you to create an Expo project
   - It will update your `app.json` with a project ID

2. **Build Android APK:**
```bash
eas build --platform android --profile preview
```
   - This creates an APK file you can share directly
   - Download link will be provided after build completes
   - Share the APK with testers or users

#### Option B: Build for App Stores

**For Android (Google Play Store):**
```bash
# Build production APK/AAB
eas build --platform android --profile production

# Submit to Google Play Store
eas submit --platform android
```

**For iOS (Apple App Store):**
```bash
# Build production IPA
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

---

### Part 3: Environment Variables for Production

**Backend Environment Variables (already set in `/app/backend/.env`):**
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

**Frontend Environment Variables (update after backend deployment):**
```
EXPO_PUBLIC_BACKEND_URL=https://your-production-backend-url.com
```

---

## 📝 Build Profiles Explained

### Development Profile
- For internal testing
- Includes dev tools
- Creates APK for Android, simulator build for iOS

### Preview Profile
- For beta testing
- No dev tools
- Creates APK for easier distribution

### Production Profile
- For app store submission
- Optimized and minified
- Creates AAB for Google Play, IPA for App Store

---

## 🔑 Required Credentials for App Store Submission

### Google Play Store:
- Google Play Developer account ($25 one-time fee)
- Service account JSON key (for automated submission)
- App signing key

### Apple App Store:
- Apple Developer account ($99/year)
- App Store Connect API key
- Provisioning profiles and certificates

---

## 📱 App Features Summary

**5 Tabs:**
1. **Radio** - Live streaming with Spotify metadata & turntable animation
2. **Request** - Song requests, shout-outs, and competition entries via WhatsApp
3. **Schedule** - Weekly show schedule (permanent + one-time shows)
4. **Stats** - Live listener statistics (WebView embed)
5. **Socials** - Links to WhatsApp, Discord, Facebook, and X/Twitter

**External Integrations:**
- TruckSim FM Radio Stream: `https://radio.trucksim.fm:8000/radio.mp3`
- Spotify API (for metadata and album art)
- WhatsApp (for requests)
- RadioStats.info (for statistics)
- TruckSim FM Strapi API (for schedule data)

---

## 🛠️ Troubleshooting

### Issue: Build fails with "No valid credentials"
**Solution:** Run `eas login` and ensure you're logged into your Expo account

### Issue: Android build fails
**Solution:** Check that all required Android permissions are in `app.json`

### Issue: iOS build fails
**Solution:** Ensure you have an active Apple Developer account linked

### Issue: App crashes on startup
**Solution:** Check that `EXPO_PUBLIC_BACKEND_URL` is correctly set and backend is deployed

---

## 📊 Post-Deployment Monitoring

**Backend Monitoring:**
- Monitor FastAPI logs via Emergent dashboard
- Check Spotify API usage
- Monitor TruckSim FM API connectivity

**Mobile App Monitoring:**
- Use Expo's analytics dashboard
- Monitor crash reports in EAS
- Track user feedback from app stores

---

## 🔄 Updating the App

**For Backend Updates:**
1. Make changes to backend code
2. Click **Deploy** in Emergent
3. Backend updates automatically

**For Mobile App Updates:**
1. Increment version in `app.json`:
   - iOS: `ios.buildNumber`
   - Android: `android.versionCode`
   - Both: `version` (e.g., "1.0.0" → "1.0.1")
2. Rebuild with EAS:
   ```bash
   eas build --platform all --profile production
   ```
3. Submit to stores:
   ```bash
   eas submit --platform all
   ```

---

## 📞 Support & Resources

- **Expo Documentation:** https://docs.expo.dev/
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **EAS Submit Docs:** https://docs.expo.dev/submit/introduction/
- **Emergent Support:** Contact via support channel

---

## 🎯 Next Steps

1. **Update App Assets** (icons, splash screen)
2. **Deploy Backend** via Emergent
3. **Update Frontend .env** with production backend URL
4. **Run EAS Build** for your target platform
5. **Test the APK/IPA** thoroughly
6. **Submit to App Stores** (if desired)

---

**Built with ❤️ for TruckSim FM**
