import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
} from 'react-native-track-player';

const STREAM_URL = 'https://radio.trucksim.fm:8000/radio.mp3';

export const setupPlayer = async (): Promise<boolean> => {
  let isSetup = false;
  
  try {
    // Check if player is already initialized
    await TrackPlayer.getActiveTrack();
    isSetup = true;
  } catch {
    // Player not initialized, set it up
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
        // Keep playing when app loses focus
        waitForBuffer: true,
      });
      
      await TrackPlayer.updateOptions({
        android: {
          // Continue playback even when the app is killed
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
          // Don't pause when app goes to background
          stoppingAppPausesPlayback: false,
        },
        // What controls to show in notification/lock screen
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        // Compact notification capabilities
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
        ],
        // Notification capabilities
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        progressUpdateEventInterval: 10,
      });
      
      isSetup = true;
      console.log('[TrackPlayer] Setup complete with background playback enabled');
    } catch (error) {
      console.error('[TrackPlayer] Setup error:', error);
      isSetup = false;
    }
  }
  
  return isSetup;
};

export const addStreamTrack = async (title: string, artist: string, artwork?: string) => {
  // Clear any existing tracks
  await TrackPlayer.reset();
  
  // Add the live stream
  await TrackPlayer.add({
    id: 'trucksimfm-live',
    url: STREAM_URL,
    title: title || 'TruckSimFM',
    artist: artist || 'Live Radio',
    artwork: artwork || 'https://trucksim.fm/uploads/TSFM_25_IMG_57adbe1a8b.png',
    isLiveStream: true,
  });
  
  // Set repeat mode for continuous playback
  await TrackPlayer.setRepeatMode(RepeatMode.Off);
};

export const updateNowPlaying = async (title: string, artist: string, artwork?: string) => {
  try {
    const trackIndex = await TrackPlayer.getActiveTrackIndex();
    if (trackIndex !== null && trackIndex !== undefined) {
      await TrackPlayer.updateMetadataForTrack(trackIndex, {
        title: title || 'TruckSimFM',
        artist: artist || 'Live Radio',
        artwork: artwork || 'https://trucksim.fm/uploads/TSFM_25_IMG_57adbe1a8b.png',
      });
    }
  } catch (error) {
    console.error('[TrackPlayer] Error updating metadata:', error);
  }
};

export const playStream = async () => {
  await TrackPlayer.play();
};

export const pauseStream = async () => {
  await TrackPlayer.pause();
};

export const stopStream = async () => {
  await TrackPlayer.stop();
  await TrackPlayer.reset();
};

export const isPlaying = async (): Promise<boolean> => {
  try {
    const state = await TrackPlayer.getPlaybackState();
    return state.state === 'playing';
  } catch {
    return false;
  }
};

// Playback service - handles background events
// This is called by react-native-track-player when the app is in the background
export const PlaybackService = async () => {
  // Remote play event (from notification/lock screen)
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    console.log('[PlaybackService] RemotePlay event');
    TrackPlayer.play();
  });

  // Remote pause event (from notification/lock screen)
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    console.log('[PlaybackService] RemotePause event');
    TrackPlayer.pause();
  });

  // Remote stop event (from notification/lock screen)
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    console.log('[PlaybackService] RemoteStop event');
    TrackPlayer.stop();
  });

  // Handle audio interruptions (phone calls, other apps)
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    console.log('[PlaybackService] RemoteDuck event', event);
    if (event.paused) {
      // Another app requested audio focus, pause playback
      await TrackPlayer.pause();
    } else if (event.permanent) {
      // Permanent loss of audio focus, stop playback
      await TrackPlayer.stop();
    } else {
      // Ducking - lower volume (handled automatically by the library)
    }
  });

  // Handle playback errors
  TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
    console.error('[PlaybackService] Playback error:', event);
  });

  // Handle playback state changes
  TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    console.log('[PlaybackService] Playback state changed:', event.state);
  });
};
