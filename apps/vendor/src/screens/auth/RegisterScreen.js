import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/slices/authSlice';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    category: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: '',
    longitude: ''
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const categories = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'fast-food', label: 'Fast Food' },
    { value: 'dessert', label: 'Dessert Shop' },
    { value: 'beverage', label: 'Beverage Shop' }
  ];

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, phone, businessName, category, address, city, state, zipCode } = formData;

    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim() || !businessName.trim() || !category.trim() || !address.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleRegister = () => {
    if (!validateForm()) return;

    const { name, email, password, phone, businessName, category, description, address, city, state, zipCode, latitude, longitude } = formData;
    
    dispatch(registerUser({ 
      name: name.trim(), 
      email: email.trim(), 
      password, 
      phone,
      role: 'vendor',
      businessInfo: {
        businessName: businessName.trim(),
        category: category.trim(),
        description: description.trim(),
        location: {
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
          coordinates: {
            latitude: latitude ? parseFloat(latitude) : 40.7128, // Default to NYC if not provided
            longitude: longitude ? parseFloat(longitude) : -74.0060
          }
        },
        deliveryFee: 2.99,
        minimumOrder: 15
      }
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Register Your Restaurant</Text>
          <Text style={styles.subtitle}>Join our delivery platform</Text>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            <Text style={styles.sectionTitle}>Business Information</Text>

            <TextInput
              style={styles.input}
              placeholder="Business Name *"
              value={formData.businessName}
              onChangeText={(value) => handleInputChange('businessName', value)}
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.inputText, !formData.category && styles.placeholder]}>
                {formData.category ? categories.find(c => c.value === formData.category)?.label : 'Select Category *'}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Business Description"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.sectionTitle}>Location Information</Text>

            <TextInput
              style={styles.input}
              placeholder="Address *"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              autoCapitalize="words"
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="City *"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                autoCapitalize="words"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="State *"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
                autoCapitalize="words"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="ZIP Code *"
              value={formData.zipCode}
              onChangeText={(value) => handleInputChange('zipCode', value)}
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Latitude (optional)"
                value={formData.latitude}
                onChangeText={(value) => handleInputChange('latitude', value)}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Longitude (optional)"
                value={formData.longitude}
                onChangeText={(value) => handleInputChange('longitude', value)}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.sectionTitle}>Security</Text>

            <TextInput
              style={styles.input}
              placeholder="Password *"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Register Restaurant</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Business Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => {
                    handleInputChange('category', item.value);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#FF6B35',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    paddingTop: 16,
  },
  placeholder: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  categoryItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
});
