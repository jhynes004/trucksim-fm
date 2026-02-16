import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { Colors } from '@/constants/colors';

const WHATSAPP_NUMBER = '+447700183123';

type RequestType = 'song' | 'shoutout' | 'competition';

interface RequestTypeOption {
  value: RequestType;
  label: string;
  icon: string;
  description: string;
}

const REQUEST_TYPES: RequestTypeOption[] = [
  {
    value: 'song',
    label: 'Song Request',
    icon: '🎵',
    description: 'Request a song to be played',
  },
  {
    value: 'shoutout',
    label: 'Shout-out',
    icon: '📣',
    description: 'Send a shout-out message',
  },
  {
    value: 'competition',
    label: 'Competition Entry',
    icon: '🏆',
    description: 'Enter an active competition',
  },
];

export default function RequestScreen() {
  const [requestType, setRequestType] = useState<RequestType>('song');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [yourName, setYourName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendViaWhatsApp = () => {
    if (!artistName.trim() || !songTitle.trim()) {
      Alert.alert('Required Fields', 'Please enter at least the artist and song title.');
      return;
    }

    // Build the WhatsApp message
    let whatsappMessage = `🎵 Song Request\n\n`;
    whatsappMessage += `Artist: ${artistName}\n`;
    whatsappMessage += `Song: ${songTitle}\n`;
    
    if (yourName.trim()) {
      whatsappMessage += `From: ${yourName}\n`;
    }
    
    if (message.trim()) {
      whatsappMessage += `\nMessage: ${message}`;
    }

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('Error', 'WhatsApp is not installed on this device');
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('Error', 'Failed to open WhatsApp');
      });
  };

  const handleSubmit = () => {
    sendViaWhatsApp();
  };

  const clearForm = () => {
    setArtistName('');
    setSongTitle('');
    setYourName('');
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Song Request</Text>
          <Text style={styles.subtitle}>
            Send your song request to TruckSimFM
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📱 Requests are sent via WhatsApp to our live presenters
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Artist Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Artist Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter artist name"
              placeholderTextColor={Colors.textMuted}
              value={artistName}
              onChangeText={setArtistName}
              autoCapitalize="words"
            />
          </View>

          {/* Song Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Song Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter song title"
              placeholderTextColor={Colors.textMuted}
              value={songTitle}
              onChangeText={setSongTitle}
              autoCapitalize="words"
            />
          </View>

          {/* Your Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textMuted}
              value={yourName}
              onChangeText={setYourName}
              autoCapitalize="words"
            />
          </View>

          {/* Message */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a message for the presenter..."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                📱 Send via WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearForm}
            >
              <Text style={[styles.buttonText, styles.clearButtonText]}>
                Clear Form
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Tip: Make sure you have WhatsApp installed to send requests
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
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
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 56,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  buttonContainer: {
    marginTop: 12,
    gap: 12,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  clearButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  clearButtonText: {
    color: Colors.textSecondary,
  },
  footer: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
