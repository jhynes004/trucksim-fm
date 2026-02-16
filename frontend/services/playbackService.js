import TrackPlayer, { Event } from 'react-native-track-player';

// Playback service - handles background events
// This is called by react-native-track-player when the app is in the background
module.exports = async function () {
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
    }
    // else: Ducking - lower volume (handled automatically by the library)
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
