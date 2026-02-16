import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

// Radio icon - looks like an old-fashioned radio with antenna
const RadioIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    {/* Antenna */}
    <View style={{
      position: 'absolute',
      top: 0,
      left: 6,
      width: 2,
      height: 8,
      backgroundColor: color,
      transform: [{ rotate: '-30deg' }],
    }} />
    {/* Radio body */}
    <View style={{
      width: 20,
      height: 14,
      borderWidth: 2,
      borderColor: color,
      borderRadius: 3,
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    }}>
      {/* Speaker grille */}
      <View style={{ flexDirection: 'column', gap: 1 }}>
        <View style={{ width: 6, height: 1, backgroundColor: color }} />
        <View style={{ width: 6, height: 1, backgroundColor: color }} />
        <View style={{ width: 6, height: 1, backgroundColor: color }} />
      </View>
      {/* Dial */}
      <View style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: color,
      }} />
    </View>
  </View>
);

// Mail/Envelope icon for request
const MailIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 20,
      height: 14,
      borderWidth: 2,
      borderColor: color,
      borderRadius: 2,
      position: 'relative',
    }}>
      {/* Envelope flap */}
      <View style={{
        position: 'absolute',
        top: -1,
        left: 2,
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
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
          tabBarIcon: ({ color }) => <MailIcon color={color} />,
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
