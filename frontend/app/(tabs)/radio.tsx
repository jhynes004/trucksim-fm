import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { getCurrentSong, CurrentSong } from '../../services/radioService';
import { searchSpotifyTrack, SpotifyTrack } from '../../services/spotifyService';
import { getLivePresenter, LivePresenter } from '../../services/presenterService';
import { getRecentlyPlayed, formatPlayedTime, RecentlyPlayedTrack } from '../../services/recentlyPlayedService';

const { width } = Dimensions.get('window');
const TURNTABLE_SIZE = width * 0.55;
const STREAM_URL = 'https://radio.trucksim.fm:8000/radio.mp3';
const LOGO_URL = 'https://trucksim.fm/uploads/TSFM_25_IMG_57adbe1a8b.png';
const PLACEHOLDER_ALBUM = 'https://trucksim.fm/uploads/TSFM_25_IMG_57adbe1a8b.png';

// Simple SVG Icons as components
const PlayIcon = () => (
  <View style={styles.icon}>
    <View style={styles.playTriangle} />
  </View>
);

const StopIcon = () => (
  <View style={styles.icon}>
    <View style={styles.stopSquare} />
  </View>
);

export default function RadioScreen() {
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState<CurrentSong>({
    title: 'TruckSimFM',
    artist: 'Tap Play to Start',
  });
  const [spotifyData, setSpotifyData] = useState<SpotifyTrack | null>(null);
  const [livePresenter, setLivePresenter] = useState<LivePresenter | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  const [albumArtLoaded, setAlbumArtLoaded] = useState(false);
  const songUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const presenterUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const recentlyPlayedInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSearchedSong = useRef<string>('');

  // Animation value for turntable rotation
  const rotation = useSharedValue(0);

  // Animated style for turntable
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Start/stop rotation based on playback state
  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 3000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(Math.floor(rotation.value / 360) * 360, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isPlaying]);

  // Fetch live presenter and recently played on mount
  useEffect(() => {
    fetchLivePresenter();
    fetchRecentlyPlayed();
    
    presenterUpdateInterval.current = setInterval(() => {
      fetchLivePresenter();
    }, 60000); // Update every minute

    recentlyPlayedInterval.current = setInterval(() => {
      fetchRecentlyPlayed();
    }, 30000); // Update every 30 seconds

    return () => {
      if (presenterUpdateInterval.current) {
        clearInterval(presenterUpdateInterval.current);
      }
      if (recentlyPlayedInterval.current) {
        clearInterval(recentlyPlayedInterval.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (songUpdateInterval.current) {
        clearInterval(songUpdateInterval.current);
      }
    };
  }, []);

  // Update current song periodically
  useEffect(() => {
    if (isPlaying) {
      updateCurrentSong();
      songUpdateInterval.current = setInterval(() => {
        updateCurrentSong();
      }, 10000);
    } else {
      if (songUpdateInterval.current) {
        clearInterval(songUpdateInterval.current);
        songUpdateInterval.current = null;
      }
    }

    return () => {
      if (songUpdateInterval.current) {
        clearInterval(songUpdateInterval.current);
      }
    };
  }, [isPlaying]);

  const fetchLivePresenter = async () => {
    try {
      const presenter = await getLivePresenter();
      setLivePresenter(presenter);
    } catch (error) {
      console.error('Error fetching live presenter:', error);
    }
  };

  const fetchRecentlyPlayed = async () => {
    try {
      const tracks = await getRecentlyPlayed(5);
      setRecentlyPlayed(tracks);
    } catch (error) {
      console.error('Error fetching recently played:', error);
    }
  };

  const updateCurrentSong = async () => {
    try {
      setFetchStatus('Fetching song...');
      const song = await getCurrentSong();
      
      const gotMessage = `Got: "${song.artist || 'NO ARTIST'}" - "${song.title || 'NO TITLE'}"`;
      setFetchStatus(gotMessage);
      setCurrentSong(song);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (song.artist && song.title && 
          song.artist !== 'Unknown Artist' && 
          song.artist !== 'Live Radio' &&
          song.title !== 'TruckSimFM') {
        const songKey = `${song.artist.toLowerCase()}-${song.title.toLowerCase()}`;
        
        if (songKey !== lastSearchedSong.current) {
          lastSearchedSong.current = songKey;
          setFetchStatus('Searching Spotify...');
          setAlbumArtLoaded(false);
          
          const spotifyResult = await searchSpotifyTrack(song.artist, song.title);
          
          if (spotifyResult && spotifyResult.album_art_url) {
            setFetchStatus('✓ Spotify loaded');
            setSpotifyData(spotifyResult);
          } else {
            setFetchStatus('No Spotify match');
            setSpotifyData(null);
          }
          
          setTimeout(() => setFetchStatus(''), 3000);
        }
      } else {
        setFetchStatus(`Invalid: artist="${song.artist}" title="${song.title}"`);
        setTimeout(() => setFetchStatus(''), 5000);
      }
    } catch (error: any) {
      setFetchStatus(`Error: ${error.message || 'Unknown error'}`);
      setTimeout(() => setFetchStatus(''), 5000);
    }
  };

  const togglePlayback = async () => {
    // Haptic feedback on button press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (isPlaying && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setCurrentSong({
          title: 'TruckSimFM',
          artist: 'Tap Play to Start',
        });
        setSpotifyData(null);
        lastSearchedSong.current = '';
        setFetchStatus('');
        setAlbumArtLoaded(false);
        // Light haptic on stop
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setIsLoading(true);
        setError(null);

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: STREAM_URL },
          { shouldPlay: true, volume: 1.0 },
          onPlaybackStatusUpdate
        );

        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);
        // Success haptic on play
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      setError('Failed to play stream');
      setIsLoading(false);
      setIsPlaying(false);
      // Error haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.error) {
      setError('Stream playback error');
      setIsPlaying(false);
    }
  };

  const albumArtUrl = spotifyData?.album_art_url || PLACEHOLDER_ALBUM;
  const displayTitle = spotifyData?.title || currentSong.title || 'TruckSimFM';
  const displayArtist = spotifyData?.artist || currentSong.artist || 'Live Radio';
  const displayAlbum = spotifyData?.album;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 10 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: LOGO_URL }}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Live Presenter Banner */}
      {livePresenter && (
        <View style={styles.presenterBanner}>
          <View style={styles.presenterInfo}>
            {livePresenter.photoUrl ? (
              <Image 
                source={{ uri: livePresenter.photoUrl }}
                style={styles.presenterPhoto}
              />
            ) : (
              <View style={styles.presenterPhotoPlaceholder}>
                <Text style={styles.presenterInitial}>
                  {livePresenter.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.presenterTextContainer}>
              <Text style={styles.presenterName} numberOfLines={1}>
                {livePresenter.isAutoDJ ? '🤖 ' : '🎙️ '}{livePresenter.name}
              </Text>
              <Text style={styles.showName} numberOfLines={1}>
                {livePresenter.showName}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Turntable with Rotation Animation */}
      <View style={styles.turntableContainer}>
        <Animated.View style={[styles.turntable, animatedStyle]}>
          {!albumArtLoaded && (
            <Image
              source={{ uri: PLACEHOLDER_ALBUM }}
              style={[styles.albumArt, styles.placeholderImage]}
              resizeMode="contain"
            />
          )}
          <Image
            source={{ uri: albumArtUrl }}
            style={[styles.albumArt, !albumArtLoaded && { opacity: 0 }]}
            resizeMode="cover"
            onLoad={() => setAlbumArtLoaded(true)}
            onError={() => setAlbumArtLoaded(true)}
          />
          <View style={styles.vinylCenter} />
        </Animated.View>
      </View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={2}>
          {displayTitle}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {displayArtist}
        </Text>
        {displayAlbum && (
          <Text style={styles.songAlbum} numberOfLines={1}>
            {displayAlbum}
          </Text>
        )}
      </View>

      {/* Status Indicator */}
      {fetchStatus && (
        <View style={styles.statusIndicator}>
          <Text style={styles.statusText}>{fetchStatus}</Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Play/Stop Button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={togglePlayback}
        disabled={isLoading}
        data-testid="play-stop-button"
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.text} />
        ) : isPlaying ? (
          <StopIcon />
        ) : (
          <PlayIcon />
        )}
      </TouchableOpacity>

      {/* Stream Status */}
      <Text style={styles.bottomStatusText}>
        {isLoading
          ? 'Connecting...'
          : isPlaying
          ? 'Now Playing'
          : 'Tap to Play'}
      </Text>

      {/* Recently Played Section */}
      {recentlyPlayed.length > 0 && (
        <View style={styles.recentlyPlayedSection}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          {recentlyPlayed.map((track, index) => (
            <View key={index} style={styles.recentTrack}>
              {track.artwork_url ? (
                <Image 
                  source={{ uri: track.artwork_url }}
                  style={styles.recentTrackArt}
                />
              ) : (
                <View style={styles.recentTrackArtPlaceholder}>
                  <Text style={styles.recentTrackArtText}>🎵</Text>
                </View>
              )}
              <View style={styles.recentTrackInfo}>
                <Text style={styles.recentTrackTitle} numberOfLines={1}>
                  {track.song}
                </Text>
                <Text style={styles.recentTrackArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
              <Text style={styles.recentTrackTime}>
                {formatPlayedTime(track.played_at)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom padding for tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 160,
    height: 50,
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text,
    marginRight: 6,
  },
  liveText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 12,
  },
  presenterBanner: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presenterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presenterPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  presenterPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenterInitial: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  presenterTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  presenterName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  showName: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  turntableContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  turntable: {
    width: TURNTABLE_SIZE,
    height: TURNTABLE_SIZE,
    borderRadius: TURNTABLE_SIZE / 2,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: Colors.surface,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  albumArt: {
    width: TURNTABLE_SIZE * 0.7,
    height: TURNTABLE_SIZE * 0.7,
    borderRadius: (TURNTABLE_SIZE * 0.7) / 2,
    position: 'absolute',
  },
  placeholderImage: {
    opacity: 0.5,
  },
  vinylCenter: {
    position: 'absolute',
    width: TURNTABLE_SIZE * 0.16,
    height: TURNTABLE_SIZE * 0.16,
    borderRadius: (TURNTABLE_SIZE * 0.16) / 2,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  songInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  songArtist: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  songAlbum: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  statusIndicator: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomStatusText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 20,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 0,
    borderBottomWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: Colors.text,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 4,
  },
  stopSquare: {
    width: 24,
    height: 24,
    backgroundColor: Colors.text,
    borderRadius: 3,
  },
  // Recently Played Section
  recentlyPlayedSection: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  recentTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recentTrackArt: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: Colors.card,
  },
  recentTrackArtPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTrackArtText: {
    fontSize: 20,
  },
  recentTrackInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  recentTrackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  recentTrackArtist: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  recentTrackTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
