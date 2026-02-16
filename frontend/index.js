import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import { ExpoRoot } from 'expo-router';

// Register the playback service for background audio
// This must be at the top level, before any React rendering
TrackPlayer.registerPlaybackService(() => require('./services/playbackService'));

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
