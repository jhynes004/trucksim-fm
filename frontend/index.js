import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import { ExpoRoot } from 'expo-router';
import { PlaybackService } from './services/trackPlayerService';

// Register the playback service for background audio
TrackPlayer.registerPlaybackService(() => PlaybackService);

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
