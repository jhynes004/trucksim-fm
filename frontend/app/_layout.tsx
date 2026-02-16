import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  useEffect(() => {
    // Configure audio mode for playback
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
