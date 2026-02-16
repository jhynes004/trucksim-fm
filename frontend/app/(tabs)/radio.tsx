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
  Modal,
  Alert,
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
import { getRecentlyPlayed, formatPlayedTime, likeSong, RecentlyPlayedTrack } from '../../services/recentlyPlayedService';

const { width } = Dimensions.get('window');
const TURNTABLE_SIZE = width * 0.55;
const STREAM_URL = 'https://radio.trucksim.fm:8000/radio.mp3';
const LOGO_URL = 'https://trucksim.fm/uploads/TSFM_25_IMG_57adbe1a8b.png';

// Use the bundled placeholder image
const PlaceholderAlbum = require('../../assets/images/placeholder-album.png');

// Sleep timer options in minutes
const SLEEP_OPTIONS = [5, 15, 30, 45, 60, 90];

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

const HeartIcon = ({ filled, color }: { filled: boolean; color: string }) => (
  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 14,
      height: 14,
      backgroundColor: filled ? color : 'transparent',
      borderWidth: filled ? 0 : 2,
      borderColor: color,
      borderRadius: 2,
      transform: [{ rotate: '45deg' }],
    }}>
      <View style={{
        position: 'absolute',
        top: -7,
        left: 0,
        width: 14,
        height: 14,
        backgroundColor: filled ? color : 'transparent',
        borderWidth: filled ? 0 : 2,
        borderColor: color,
        borderRadius: 7,
      }} />
      <View style={{
        position: 'absolute',
        left: -7,
        top: 0,
        width: 14,
        height: 14,
        backgroundColor: filled ? color : 'transparent',
        borderWidth: filled ? 0 : 2,
        borderColor: color,
        borderRadius: 7,
      }} />
    </View>
  </View>
);

const MoonIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: color,
      borderRightColor: 'transparent',
      transform: [{ rotate: '-45deg' }],
    }} />
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
  
  // Sleep timer state
  const [sleepTimerActive, setSleepTimerActive] = useState(false);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState(0);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Like state - track which songs the user has liked this session
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  
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
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
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

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimerActive && sleepTimeRemaining > 0) {
      sleepTimerRef.current = setInterval(() => {
        setSleepTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - stop playback
            stopPlayback();
            setSleepTimerActive(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, [sleepTimerActive]);

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

  const stopPlayback = async () => {
    if (sound) {
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
    }
  };

  const togglePlayback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (isPlaying && sound) {
        await stopPlayback();
        // Cancel sleep timer when stopping manually
        setSleepTimerActive(false);
        setSleepTimeRemaining(0);
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
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      setError('Failed to play stream');
      setIsLoading(false);
      setIsPlaying(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.error) {
      setError('Stream playback error');
      setIsPlaying(false);
    }
  };

  const startSleepTimer = async (minutes: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSleepTimeRemaining(minutes * 60);
    setSleepTimerActive(true);
    setShowSleepModal(false);
  };

  const cancelSleepTimer = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSleepTimerActive(false);
    setSleepTimeRemaining(0);
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
    }
  };

  const formatSleepTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLikeSong = async (track: RecentlyPlayedTrack) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Prevent liking the same song twice in one session
    if (likedSongs.has(track.documentId)) {
      Alert.alert('Already Liked', 'You already liked this song!');
      return;
    }
    
    const result = await likeSong(track.documentId);
    
    if (result.success) {
      // Update the liked songs set
      setLikedSongs(prev => new Set([...prev, track.documentId]));
      
      // Update the like count in the local state
      setRecentlyPlayed(prev => prev.map(t => 
        t.documentId === track.documentId 
          ? { ...t, likes: result.likes || t.likes + 1 }
          : t
      ));
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Error', 'Failed to like song. Please try again.');
    }
  };

  const albumArtUrl = spotifyData?.album_art_url;
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
        <View style={styles.headerRow}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          
          {/* Sleep Timer Button */}
          {isPlaying && (
            <TouchableOpacity 
              style={[styles.sleepButton, sleepTimerActive && styles.sleepButtonActive]}
              onPress={() => sleepTimerActive ? cancelSleepTimer() : setShowSleepModal(true)}
              data-testid="sleep-timer-button"
            >
              <MoonIcon color={sleepTimerActive ? Colors.background : Colors.textMuted} />
              {sleepTimerActive && (
                <Text style={styles.sleepTimeText}>{formatSleepTime(sleepTimeRemaining)}</Text>
              )}
            </TouchableOpacity>
          )}
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
          {/* Show placeholder when no album art or still loading */}
          {(!albumArtUrl || !albumArtLoaded) && (
            <Image
              source={PlaceholderAlbum}
              style={[styles.albumArt, styles.placeholderImage]}
              resizeMode="cover"
            />
          )}
          {/* Show Spotify album art when available */}
          {albumArtUrl && (
            <Image
              source={{ uri: albumArtUrl }}
              style={[styles.albumArt, !albumArtLoaded && { opacity: 0 }]}
              resizeMode="cover"
              onLoad={() => setAlbumArtLoaded(true)}
              onError={() => setAlbumArtLoaded(false)}
            />
          )}
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
            <View key={track.documentId || index} style={styles.recentTrack}>
              {track.artwork_url ? (
                <Image 
                  source={{ uri: track.artwork_url }}
                  style={styles.recentTrackArt}
                />
              ) : (
                <Image
                  source={PlaceholderAlbum}
                  style={styles.recentTrackArt}
                />
              )}
              <View style={styles.recentTrackInfo}>
                <Text style={styles.recentTrackTitle} numberOfLines={1}>
                  {track.song}
                </Text>
                <Text style={styles.recentTrackArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
              <View style={styles.recentTrackRight}>
                <TouchableOpacity 
                  style={styles.likeButton}
                  onPress={() => handleLikeSong(track)}
                  data-testid={`like-button-${track.documentId}`}
                >
                  <Text style={[
                    styles.likeText,
                    likedSongs.has(track.documentId) && styles.likedText
                  ]}>
                    👍 {track.likes}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.recentTrackTime}>
                  {formatPlayedTime(track.played_at)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Bottom padding for tab bar */}
      <View style={{ height: 100 }} />

      {/* Sleep Timer Modal */}
      <Modal
        visible={showSleepModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSleepModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSleepModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sleep Timer</Text>
            <Text style={styles.modalSubtitle}>Stop playback after:</Text>
            
            <View style={styles.sleepOptions}>
              {SLEEP_OPTIONS.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={styles.sleepOption}
                  onPress={() => startSleepTimer(minutes)}
                >
                  <Text style={styles.sleepOptionText}>{minutes} min</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowSleepModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  sleepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sleepButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sleepTimeText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
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
    opacity: 0.8,
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
  recentTrackRight: {
    alignItems: 'flex-end',
  },
  likeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginBottom: 4,
  },
  likeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  likedText: {
    color: Colors.primary,
  },
  recentTrackTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  sleepOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  sleepOption: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  sleepOptionText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modalCancel: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
});
