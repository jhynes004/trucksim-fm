import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Alert, Image } from 'react-native';
import { Colors } from '@/constants/colors';

interface SocialLink {
  name: string;
  logo: any;
  url: string;
  color: string;
  description: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'WhatsApp',
    logo: require('@/assets/social-logos/whatsapp.png'),
    url: 'https://wa.me/447700183123',
    color: '#25D366',
    description: 'Message us directly on WhatsApp',
  },
  {
    name: 'Discord',
    logo: require('@/assets/social-logos/discord.png'),
    url: 'http://discord.trucksim.fm/',
    color: '#5865F2',
    description: 'Join our Discord community',
  },
  {
    name: 'Facebook',
    logo: require('@/assets/social-logos/facebook.png'),
    url: 'https://facebook.com/TruckSimFM',
    color: '#1877F2',
    description: 'Follow us on Facebook',
  },
  {
    name: 'X (Twitter)',
    logo: require('@/assets/social-logos/x-twitter.png'),
    url: 'https://x.com/trucksimfm',
    color: '#000000',
    description: 'Follow us on X (Twitter)',
  },
];

export default function SocialsScreen() {
  const openSocialLink = (link: SocialLink) => {
    Linking.canOpenURL(link.url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(link.url);
        } else {
          Alert.alert('Error', `Cannot open ${link.name}`);
        }
      })
      .catch((err) => {
        console.error(`Error opening ${link.name}:`, err);
        Alert.alert('Error', `Failed to open ${link.name}`);
      });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Connect With Us</Text>
        <Text style={styles.subtitle}>
          Follow TruckSimFM on social media
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🌟 Stay updated with the latest news, events, and behind-the-scenes content!
          </Text>
        </View>

        {/* Social Links */}
        {SOCIAL_LINKS.map((link) => (
          <TouchableOpacity
            key={link.name}
            style={[styles.socialCard, { borderLeftColor: link.color }]}
            onPress={() => openSocialLink(link)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: link.color }]}>
              <Text style={styles.socialIcon}>{link.icon}</Text>
            </View>
            
            <View style={styles.socialInfo}>
              <Text style={styles.socialName}>{link.name}</Text>
              <Text style={styles.socialDescription}>{link.description}</Text>
            </View>

            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Tap any platform to open it in your browser or app
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: 24,
  },
  infoText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  socialIcon: {
    fontSize: 28,
  },
  socialInfo: {
    flex: 1,
  },
  socialName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  socialDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: Colors.primary,
    marginLeft: 12,
  },
  footer: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
