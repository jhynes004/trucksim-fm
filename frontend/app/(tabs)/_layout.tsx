import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

// Simple icon components using basic shapes
const RadioIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: color,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <View style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
      }} />
    </View>
  </View>
);

const MusicNoteIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 16,
      height: 20,
      borderLeftWidth: 3,
      borderLeftColor: color,
      borderTopWidth: 3,
      borderTopColor: color,
      borderTopLeftRadius: 8,
    }}>
      <View style={{
        position: 'absolute',
        bottom: -4,
        left: -6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
      }} />
    </View>
  </View>
);

const CalendarIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 18,
      height: 20,
      borderWidth: 2,
      borderColor: color,
      borderRadius: 3,
    }}>
      <View style={{
        position: 'absolute',
        top: -6,
        left: 2,
        width: 2,
        height: 6,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        top: -6,
        right: 2,
        width: 2,
        height: 6,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        top: 6,
        left: 3,
        width: 10,
        height: 2,
        backgroundColor: color,
      }} />
    </View>
  </View>
);

const ChartIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 2 }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
      <View style={{ width: 4, height: 12, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 4, height: 18, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 4, height: 8, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 4, height: 14, backgroundColor: color, borderRadius: 1 }} />
    </View>
  </View>
);

const ShareIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: color,
    }}>
      <View style={{
        position: 'absolute',
        top: -8,
        left: 5,
        width: 2,
        height: 10,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        top: -10,
        left: 1,
        width: 0,
        height: 0,
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderBottomWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
      }} />
    </View>
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculate tab bar height: base height + safe area bottom inset
  const tabBarHeight = 60 + insets.bottom;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="radio"
        options={{
          title: 'Radio',
          tabBarIcon: ({ color }) => <RadioIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="request"
        options={{
          title: 'Request',
          tabBarIcon: ({ color }) => <MusicNoteIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <CalendarIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <ChartIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="socials"
        options={{
          title: 'Socials',
          tabBarIcon: ({ color }) => <ShareIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
