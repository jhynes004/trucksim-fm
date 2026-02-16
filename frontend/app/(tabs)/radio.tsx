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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { parsePlsPlaylist } from '@/services/plsParser';
import { getCurrentSong, CurrentSong } from '@/services/radioService';

const { width } = Dimensions.get('window');
const TURNTABLE_SIZE = width * 0.7;
const PLS_URL = 'https://radio.trucksim.fm:8000/listen.pls?sid=1';
const LOGO_URL = 'https://trucksim.fm/uploads/TSFM_25_IMG_57adbe1a8b.png';

export default function RadioScreen() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<CurrentSong>({
    title: 'TruckSimFM',
    artist: 'Loading...',
  });
  const [error, setError] = useState<string | null>(null);
  const songUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Parse .pls file on mount
  useEffect(() => {
    parseStreamUrl();
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
      // Update immediately
      updateCurrentSong();
      // Then update every 10 seconds
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

  const parseStreamUrl = async () => {
    try {
      console.log('Parsing .pls file from:', PLS_URL);
      const urls = await parsePlsPlaylist(PLS_URL);
      if (urls.length > 0) {
        console.log('Stream URL found:', urls[0]);
        setStreamUrl(urls[0]);
        setError(null);
      } else {
        setError('No stream URL found in playlist');
      }
    } catch (err) {
      console.error('Error parsing stream URL:', err);
      setError('Failed to load stream URL');
    }
  };

  const updateCurrentSong = async () => {
    const song = await getCurrentSong();
    setCurrentSong(song);
  };

  const togglePlayback = async () => {
    if (!streamUrl) {
      setError('Stream URL not available');
      return;
    }

    try {
      if (isPlaying && sound) {
        // Stop
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      } else {
        // Play
        setIsLoading(true);
        setError(null);

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true, volume: 1.0 },
          onPlaybackStatusUpdate
        );

        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to play stream');
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.error) {
      console.error('Playback status error:', status.error);
      setError('Stream playback error');
      setIsPlaying(false);
    }
  };

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

      {/* Turntable */}
      <View style={styles.turntableContainer}>
        <View style={[styles.turntable, isPlaying && styles.turntablePlaying]}>
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.albumArt}
            resizeMode="cover"
          />
          {/* Vinyl effect */}
          <View style={styles.vinylCenter} />
        </View>
      </View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {currentSong.title || 'TruckSimFM'}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {currentSong.artist || 'Live Radio'}
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Play/Pause Button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={togglePlayback}
        disabled={isLoading || !streamUrl}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.text} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={48}
            color={Colors.text}
          />
        )}
      </TouchableOpacity>

      {/* Stream Status */}
      <Text style={styles.statusText}>
        {isLoading
          ? 'Connecting...'
          : isPlaying
          ? 'Now Playing'
          : streamUrl
          ? 'Tap to Play'
          : 'Loading stream...'}
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
  turntablePlaying: {
    // Animation will be added in Phase 2
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
    marginBottom: 32,
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
    marginLeft: 8,
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
  statusText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
