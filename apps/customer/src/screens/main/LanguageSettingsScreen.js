import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LanguageSettingsScreen({ navigation }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
  ];

  const regions = [
    {
      title: 'Most Popular',
      languages: ['en', 'es', 'fr', 'de']
    },
    {
      title: 'European Languages',
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru']
    },
    {
      title: 'Asian Languages',
      languages: ['zh', 'ja', 'ko', 'hi']
    },
    {
      title: 'Other Languages',
      languages: ['ar']
    }
  ];

  const handleLanguageChange = (languageCode) => {
    Alert.alert(
      'Change Language',
      `Change app language to ${languages.find(l => l.code === languageCode)?.name}? The app will restart to apply changes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: () => {
            setSelectedLanguage(languageCode);
            // In a real app, you would save this to AsyncStorage and restart the app
            Alert.alert('Language Changed', 'Language has been updated successfully!');
          }
        }
      ]
    );
  };

  const LanguageItem = ({ language, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
      onPress={onPress}
    >
      <View style={styles.languageLeft}>
        <Text style={styles.flag}>{language.flag}</Text>
        <View style={styles.languageText}>
          <Text style={[styles.languageName, isSelected && styles.selectedText]}>
            {language.name}
          </Text>
          <Text style={[styles.languageNative, isSelected && styles.selectedSubtext]}>
            {language.nativeName}
          </Text>
        </View>
      </View>
      {isSelected && <Ionicons name="checkmark" size={24} color="#FF6B35" />}
    </TouchableOpacity>
  );

  const getLanguageDisplayName = (code) => {
    return languages.find(l => l.code === code)?.name || 'English';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Current Selection */}
        <View style={styles.currentSection}>
          <Text style={styles.currentLabel}>Current Language</Text>
          <View style={styles.currentLanguage}>
            <Text style={styles.currentFlag}>
              {languages.find(l => l.code === selectedLanguage)?.flag}
            </Text>
            <Text style={styles.currentName}>
              {getLanguageDisplayName(selectedLanguage)}
            </Text>
          </View>
        </View>

        {/* Language Regions */}
        {regions.map((region, regionIndex) => (
          <View key={regionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{region.title}</Text>
            {region.languages.map((langCode) => {
              const language = languages.find(l => l.code === langCode);
              if (!language) return null;
              
              return (
                <LanguageItem
                  key={language.code}
                  language={language}
                  isSelected={selectedLanguage === language.code}
                  onPress={() => handleLanguageChange(language.code)}
                />
              );
            })}
          </View>
        ))}

        {/* Language Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.infoTitle}>Language Information</Text>
          </View>
          <Text style={styles.infoText}>
            • Changing the language will restart the app{'\n'}
            • Menu items and restaurant information may still appear in the original language{'\n'}
            • Some features may not be available in all languages{'\n'}
            • Language preference is saved to your account
          </Text>
        </View>

        {/* Translation Help */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Help us translate</Text>
          <Text style={styles.helpText}>
            Don't see your language? Help us improve our translations or add new languages.
          </Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => Alert.alert(
              'Translation Help',
              'Thank you for your interest! Translation help feature will be available soon.'
            )}
          >
            <Text style={styles.helpButtonText}>Contribute to translations</Text>
          </TouchableOpacity>
        </View>

        {/* Auto-Translate Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Translation Settings</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Auto Translate', 'Auto translation feature will be available soon!')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto-translate menus</Text>
                <Text style={styles.settingDescription}>
                  Automatically translate restaurant menus
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Regional Format', 'Regional format settings will be available soon!')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="location" size={24} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Regional format</Text>
                <Text style={styles.settingDescription}>
                  Date, time, and currency format
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>🌍 Language Tips</Text>
          <Text style={styles.tipsText}>
            • Choose your preferred language for the best experience{'\n'}
            • The app will remember your language choice{'\n'}
            • Restaurant content may still appear in the original language{'\n'}
            • Contact support if you need help with translations
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  currentSection: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  currentLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentFlag: {
    fontSize: 24,
    marginRight: 15,
  },
  currentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedLanguageItem: {
    backgroundColor: '#FFF5F0',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 20,
    marginRight: 15,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  languageNative: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedText: {
    color: '#FF6B35',
  },
  selectedSubtext: {
    color: '#FF6B35',
    opacity: 0.7,
  },
  infoSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  helpSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 15,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  helpButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  helpButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tipsContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#FFE066',
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
