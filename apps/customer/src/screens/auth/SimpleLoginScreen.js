import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useDispatch } from 'react-redux';
import { api } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SimpleLoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('customer@test.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { user, token } = response.data.data;

        // Store token
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        Alert.alert('Success', 'Login successful!');
        
        // Navigate to main app
        // For now, just show success message
      } else {
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.linkButton}
        onPress={handleRegister}
      >
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>

      <Text style={styles.testInfo}>
        Test Credentials:{'\n'}
        Email: customer@test.com{'\n'}
        Password: password123
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#FF6B35',
    fontSize: 16,
  },
  testInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
