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
    let whatsappMessage = '';
    let isValid = false;

    switch (requestType) {
      case 'song':
        // Song Request: Artist + Song + Name + Message
        if (!artistName.trim() || !songTitle.trim()) {
          Alert.alert('Required Fields', 'Please enter the artist and song title.');
          return;
        }
        isValid = true;
        whatsappMessage = `🎵 Song Request\n\n`;
        whatsappMessage += `Artist: ${artistName}\n`;
        whatsappMessage += `Song: ${songTitle}\n`;
        if (yourName.trim()) {
          whatsappMessage += `From: ${yourName}\n`;
        }
        if (message.trim()) {
          whatsappMessage += `\nMessage: ${message}`;
        }
        break;

      case 'shoutout':
        // Shout-out: Name + Message
        if (!yourName.trim() || !message.trim()) {
          Alert.alert('Required Fields', 'Please enter your name and message for the shout-out.');
          return;
        }
        isValid = true;
        whatsappMessage = `📣 Shout-out\n\n`;
        whatsappMessage += `From: ${yourName}\n`;
        whatsappMessage += `\nMessage: ${message}`;
        break;

      case 'competition':
        // Competition Entry: Just message (with WIN prefix)
        if (!message.trim()) {
          Alert.alert('Required Fields', 'Please enter your competition answer.');
          return;
        }
        isValid = true;
        // Only send "WIN [answer]" - no header
        whatsappMessage = `WIN ${message}`;
        break;
    }

    if (!isValid) {
      return;
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

  const getSelectedType = () => {
    return REQUEST_TYPES.find(t => t.value === requestType) || REQUEST_TYPES[0];
  };

  const renderFormFields = () => {
    switch (requestType) {
      case 'song':
        return (
          <>
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
          </>
        );

      case 'shoutout':
        return (
          <>
            {/* Your Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Your Name <Text style={styles.required}>*</Text>
              </Text>
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
              <Text style={styles.label}>
                Shout-out Message <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your shout-out message..."
                placeholderTextColor={Colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </>
        );

      case 'competition':
        return (
          <>
            {/* Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Your Answer <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.competitionInputContainer}>
                <View style={styles.winPrefix}>
                  <Text style={styles.winPrefixText}>WIN</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea, styles.competitionInput]}
                  placeholder="Enter your competition answer..."
                  placeholderTextColor={Colors.textMuted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.helperText}>
                Your message will be automatically prefixed with "WIN"
              </Text>
            </View>
          </>
        );
    }
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
          <Text style={styles.title}>Request</Text>
          <Text style={styles.subtitle}>
            Send a request to TruckSimFM
          </Text>
        </View>

        {/* Request Type Selector */}
        <View style={styles.typeSelectorContainer}>
          <Text style={styles.label}>Request Type</Text>
          <TouchableOpacity
            style={styles.typeSelector}
            onPress={() => setShowTypeSelector(true)}
          >
            <View style={styles.typeSelectorContent}>
              <Text style={styles.typeIcon}>{getSelectedType().icon}</Text>
              <View style={styles.typeSelectorText}>
                <Text style={styles.typeSelectorLabel}>{getSelectedType().label}</Text>
                <Text style={styles.typeSelectorDescription}>{getSelectedType().description}</Text>
              </View>
            </View>
            <Text style={styles.typeSelectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📱 Requests are sent via WhatsApp to our live presenters
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {renderFormFields()}

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

      {/* Type Selector Modal */}
      <Modal
        visible={showTypeSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeSelector(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeSelector(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Request Type</Text>
              <TouchableOpacity onPress={() => setShowTypeSelector(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {REQUEST_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeOption,
                  requestType === type.value && styles.typeOptionActive
                ]}
                onPress={() => {
                  setRequestType(type.value);
                  setShowTypeSelector(false);
                  clearForm(); // Clear form when switching types
                }}
              >
                <Text style={styles.typeOptionIcon}>{type.icon}</Text>
                <View style={styles.typeOptionText}>
                  <Text style={styles.typeOptionLabel}>{type.label}</Text>
                  <Text style={styles.typeOptionDescription}>{type.description}</Text>
                </View>
                {requestType === type.value && (
                  <Text style={styles.typeOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  typeSelectorContainer: {
    marginBottom: 16,
  },
  typeSelector: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  typeSelectorText: {
    flex: 1,
  },
  typeSelectorLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  typeSelectorDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  typeSelectorArrow: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 12,
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
  competitionInputContainer: {
    position: 'relative',
  },
  competitionInput: {
    paddingLeft: 72,
  },
  winPrefix: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  winPrefixText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 12,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 28,
    color: Colors.textSecondary,
    paddingHorizontal: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  typeOptionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  typeOptionText: {
    flex: 1,
  },
  typeOptionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  typeOptionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  typeOptionCheck: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
