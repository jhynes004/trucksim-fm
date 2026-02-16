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
import { Colors } from '../../constants/colors';
import { getCurrentSong, CurrentSong } from '../../services/radioService';
import { searchSpotifyTrack, SpotifyTrack } from '../../services/spotifyService';

const { width } = Dimensions.get('window');
const TURNTABLE_SIZE = width * 0.7;
const STREAM_URL = 'https://radio.trucksim.fm:8000/radio.mp3';
const LOGO_URL = 'https://trucksim.fm/uploads/TSFM_25_IMG_57adbe1a8b.png';

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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState<CurrentSong>({
    title: 'TruckSimFM',
    artist: 'Tap Play to Start',
  });
  const [spotifyData, setSpotifyData] = useState<SpotifyTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  const songUpdateInterval = useRef<NodeJS.Timeout | null>(null);
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

  const updateCurrentSong = async () => {
    try {
      setFetchStatus('Fetching song...');
      const song = await getCurrentSong();
      
      // Show what we got
      const gotMessage = `Got: "${song.artist || 'NO ARTIST'}" - "${song.title || 'NO TITLE'}"`;
      setFetchStatus(gotMessage);
      setCurrentSong(song);
      
      // Wait 2 seconds so user can see what was fetched
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (song.artist && song.title && 
          song.artist !== 'Unknown Artist' && 
          song.artist !== 'Live Radio' &&
          song.title !== 'TruckSimFM') {
        const songKey = `${song.artist.toLowerCase()}-${song.title.toLowerCase()}`;
        
        if (songKey !== lastSearchedSong.current) {
          lastSearchedSong.current = songKey;
          setFetchStatus('Searching Spotify...');
          
          const spotifyResult = await searchSpotifyTrack(song.artist, song.title);
          
          if (spotifyResult && spotifyResult.album_art_url) {
            setFetchStatus('✓ Spotify loaded');
            setSpotifyData(spotifyResult);
          } else {
            setFetchStatus('No Spotify match');
            setSpotifyData(null);
          }
          
          // Clear status after 3 seconds
          setTimeout(() => setFetchStatus(''), 3000);
        }
      } else {
        setFetchStatus(`Invalid: artist="${song.artist}" title="${song.title}"`);
        setTimeout(() => setFetchStatus(''), 5000);
      }
    } catch (error) {
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

  const onPlaybackStatusUpdate = (status) => {
    if (status.error) {
      setError('Stream playback error');
      setIsPlaying(false);
    }
  };

  const albumArtUrl = spotifyData?.album_art_url || LOGO_URL;
  const displayTitle = spotifyData?.title || currentSong.title || 'TruckSimFM';
  const displayArtist = spotifyData?.artist || currentSong.artist || 'Live Radio';
  const displayAlbum = spotifyData?.album;

  return (
    <View style={styles.container}>
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

      {/* Turntable with Rotation Animation */}
      <View style={styles.turntableContainer}>
        <Animated.View style={[styles.turntable, animatedStyle]}>
          <Image
            source={{ uri: albumArtUrl }}
            style={styles.albumArt}
            resizeMode="cover"
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
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 16,
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
  turntableContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
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
  },
  vinylCenter: {
    position: 'absolute',
    width: TURNTABLE_SIZE * 0.2,
    height: TURNTABLE_SIZE * 0.2,
    borderRadius: (TURNTABLE_SIZE * 0.2) / 2,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  songInfo: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  songArtist: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  songAlbum: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  statusIndicator: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 24,
    borderRightWidth: 0,
    borderBottomWidth: 15,
    borderTopWidth: 15,
    borderLeftColor: Colors.text,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 6,
  },
  stopSquare: {
    width: 28,
    height: 28,
    backgroundColor: Colors.text,
    borderRadius: 4,
  },
});
