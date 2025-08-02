import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodsScreen({ navigation }) {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      cardType: 'visa',
      lastFour: '4242',
      expiryDate: '12/26',
      isDefault: true,
      holderName: 'John Doe'
    },
    {
      id: '2',
      type: 'card',
      cardType: 'mastercard',
      lastFour: '8888',
      expiryDate: '09/25',
      isDefault: false,
      holderName: 'John Doe'
    }
  ]);

  const [quickPaySettings, setQuickPaySettings] = useState({
    saveCards: true,
    autoFill: true,
    biometricAuth: false
  });

  const getCardIcon = (cardType) => {
    switch (cardType) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      case 'amex': return 'card';
      default: return 'card';
    }
  };

  const getCardName = (cardType) => {
    switch (cardType) {
      case 'visa': return 'Visa';
      case 'mastercard': return 'Mastercard';
      case 'amex': return 'American Express';
      default: return 'Credit Card';
    }
  };

  const handleSetDefault = (methodId) => {
    setPaymentMethods(prev => prev.map(method => ({
      ...method,
      isDefault: method.id === methodId
    })));
    Alert.alert('Success', 'Default payment method updated!');
  };

  const handleDeleteMethod = (methodId) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
          }
        }
      ]
    );
  };

  const PaymentMethodCard = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name={getCardIcon(item.cardType)} size={24} color="#FF6B35" />
          <View style={styles.cardInfo}>
            <Text style={styles.cardType}>{getCardName(item.cardType)}</Text>
            <Text style={styles.cardNumber}>•••• •••• •••• {item.lastFour}</Text>
            <Text style={styles.cardExpiry}>Expires {item.expiryDate}</Text>
          </View>
        </View>
        {item.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditPaymentMethod', { method: item })}
        >
          <Ionicons name="pencil" size={16} color="#FF6B35" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(item.id)}
          >
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Set Default</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteMethod(item.id)}
        >
          <Ionicons name="trash" size={16} color="#F44336" />
          <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const QuickPayOption = ({ icon, title, description, onPress }) => (
    <TouchableOpacity style={styles.quickPayOption} onPress={onPress}>
      <View style={styles.quickPayLeft}>
        <Ionicons name={icon} size={24} color="#FF6B35" />
        <View style={styles.quickPayText}>
          <Text style={styles.quickPayTitle}>{title}</Text>
          <Text style={styles.quickPayDescription}>{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const SettingItem = ({ title, description, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#ccc', true: '#FF6B35' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddPaymentMethod')}>
          <Ionicons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Pay Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Pay Options</Text>
          
          <QuickPayOption
            icon="phone-portrait-outline"
            title="Apple Pay"
            description="Pay with Touch ID or Face ID"
            onPress={() => Alert.alert('Apple Pay', 'Apple Pay integration will be available soon!')}
          />
          
          <QuickPayOption
            icon="logo-google"
            title="Google Pay"
            description="Pay with your Google account"
            onPress={() => Alert.alert('Google Pay', 'Google Pay integration will be available soon!')}
          />
          
          <QuickPayOption
            icon="wallet-outline"
            title="PayPal"
            description="Pay with your PayPal account"
            onPress={() => Alert.alert('PayPal', 'PayPal integration will be available soon!')}
          />
        </View>

        {/* Credit/Debit Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credit & Debit Cards</Text>
          {paymentMethods.map((method) => (
            <PaymentMethodCard key={method.id} item={method} />
          ))}
        </View>

        {/* Add New Card Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddPaymentMethod')}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add New Card</Text>
        </TouchableOpacity>

        {/* Payment Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Settings</Text>
          
          <SettingItem
            title="Save payment methods"
            description="Securely save cards for faster checkout"
            value={quickPaySettings.saveCards}
            onValueChange={(value) => setQuickPaySettings(prev => ({ ...prev, saveCards: value }))}
          />
          
          <SettingItem
            title="Auto-fill payment info"
            description="Automatically fill saved payment details"
            value={quickPaySettings.autoFill}
            onValueChange={(value) => setQuickPaySettings(prev => ({ ...prev, autoFill: value }))}
          />
          
          <SettingItem
            title="Biometric authentication"
            description="Use fingerprint or face recognition"
            value={quickPaySettings.biometricAuth}
            onValueChange={(value) => setQuickPaySettings(prev => ({ ...prev, biometricAuth: value }))}
          />
        </View>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <View style={styles.securityHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.securityTitle}>Your payments are secure</Text>
          </View>
          <Text style={styles.securityText}>
            We use industry-standard encryption to protect your payment information. 
            Your card details are never stored on our servers.
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💳 Payment Tips</Text>
          <Text style={styles.tipsText}>
            • Set a default payment method for faster checkout{'\n'}
            • Enable biometric authentication for added security{'\n'}
            • Keep your payment methods up to date{'\n'}
            • Contact your bank if you notice any suspicious activity
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  quickPayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickPayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickPayText: {
    marginLeft: 15,
    flex: 1,
  },
  quickPayTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  quickPayDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  paymentCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  cardInfo: {
    marginLeft: 15,
    flex: 1,
  },
  cardType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B35',
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
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
  settingText: {
    flex: 1,
    marginRight: 15,
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
  securityInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
