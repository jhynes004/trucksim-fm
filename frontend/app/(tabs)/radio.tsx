import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
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

const { width } = Dimensions.get('window');
const TURNTABLE_SIZE = width * 0.65;
const STREAM_URL = 'https://radio.trucksim.fm:8000/radio.mp3';
const LOGO_URL = 'https://trucksim.fm/uploads/TSFM_25_IMG_57adbe1a8b.png';

// Placeholder vinyl image - TruckSimFM logo
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
  const [error, setError] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  const [albumArtLoaded, setAlbumArtLoaded] = useState(false);
  const songUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const presenterUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Fetch live presenter on mount and periodically
  useEffect(() => {
    fetchLivePresenter();
    presenterUpdateInterval.current = setInterval(() => {
      fetchLivePresenter();
    }, 60000); // Update every minute

    return () => {
      if (presenterUpdateInterval.current) {
        clearInterval(presenterUpdateInterval.current);
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
      }
    } catch (err) {
      setError('Failed to play stream');
      setIsLoading(false);
      setIsPlaying(false);
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
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
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
          {/* Show placeholder while loading */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 60,
    marginBottom: 12,
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
    marginBottom: 16,
    marginHorizontal: 20,
    width: width - 40,
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
    marginBottom: 24,
  },
  turntable: {
    width: TURNTABLE_SIZE,
    height: TURNTABLE_SIZE,
    borderRadius: TURNTABLE_SIZE / 2,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: Colors.surface,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
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
    width: TURNTABLE_SIZE * 0.18,
    height: TURNTABLE_SIZE * 0.18,
    borderRadius: (TURNTABLE_SIZE * 0.18) / 2,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  songInfo: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  songArtist: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  songAlbum: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  statusIndicator: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomStatusText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 22,
    borderRightWidth: 0,
    borderBottomWidth: 14,
    borderTopWidth: 14,
    borderLeftColor: Colors.text,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 4,
  },
  stopSquare: {
    width: 26,
    height: 26,
    backgroundColor: Colors.text,
    borderRadius: 4,
  },
});
