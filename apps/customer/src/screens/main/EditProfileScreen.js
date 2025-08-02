import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profileImage: user?.profileImage || null
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (profileData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(profileData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileData(prev => ({
        ...prev,
        profileImage: result.assets[0].uri
      }));
    }
  };

  const FormField = ({ label, value, onChangeText, placeholder, error, keyboardType, multiline }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, error && styles.textInputError, multiline && styles.textInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            {profileData.profileImage ? (
              <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {profileData.name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <FormField
            label="Full Name"
            value={profileData.name}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
            placeholder="Enter your full name"
            error={errors.name}
          />

          <FormField
            label="Email Address"
            value={profileData.email}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
            placeholder="Enter your email"
            keyboardType="email-address"
            error={errors.email}
          />

          <FormField
            label="Phone Number"
            value={profileData.phone}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            error={errors.phone}
          />
        </View>

        {/* Account Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          
          <TouchableOpacity 
            style={styles.securityItem}
            onPress={() => Alert.alert('Change Password', 'Password change feature will be available soon!')}
          >
            <View style={styles.securityItemLeft}>
              <Ionicons name="lock-closed-outline" size={24} color="#FF6B35" />
              <View style={styles.securityItemText}>
                <Text style={styles.securityItemTitle}>Change Password</Text>
                <Text style={styles.securityItemSubtitle}>Update your account password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.securityItem}
            onPress={() => Alert.alert('Two-Factor Authentication', 'Two-factor authentication will be available soon!')}
          >
            <View style={styles.securityItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#FF6B35" />
              <View style={styles.securityItemText}>
                <Text style={styles.securityItemTitle}>Two-Factor Authentication</Text>
                <Text style={styles.securityItemSubtitle}>Add an extra layer of security</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>📝 Profile Tips</Text>
          <Text style={styles.tipsText}>
            • Use a clear profile photo to help delivery partners identify you{'\n'}
            • Keep your contact information up to date for order updates{'\n'}
            • Use your real name to avoid confusion during delivery
          </Text>
        </View>
      </View>
    </ScrollView>
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
  saveButton: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#ccc',
  },
  content: {
    padding: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  changePhotoText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textInputError: {
    borderColor: '#FF3B30',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityItemText: {
    marginLeft: 15,
    flex: 1,
  },
  securityItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  securityItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tipsContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE066',
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
