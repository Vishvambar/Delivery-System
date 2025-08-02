import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddressManagementScreen({ navigation }) {
  const [addresses, setAddresses] = useState([
    {
      id: '1',
      label: 'Home',
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      isDefault: true,
      icon: 'home'
    },
    {
      id: '2',
      label: 'Work',
      street: '456 Market Street, Suite 200',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      isDefault: false,
      icon: 'business'
    }
  ]);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSetDefault = (addressId) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    })));
    Alert.alert('Success', 'Default address updated!');
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
          }
        }
      ]
    );
  };

  const AddressCard = ({ item }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressHeaderLeft}>
          <Ionicons name={item.icon} size={24} color="#FF6B35" />
          <Text style={styles.addressLabel}>{item.label}</Text>
          {item.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setModalVisible(item.id)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.addressText}>
        {item.street}{'\n'}
        {item.city}, {item.state} {item.zipCode}
      </Text>

      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditAddress', { address: item })}
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
      </View>

      {/* Action Modal */}
      <Modal
        visible={modalVisible === item.id}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('EditAddress', { address: item });
              }}
            >
              <Ionicons name="pencil" size={20} color="#333" />
              <Text style={styles.modalItemText}>Edit Address</Text>
            </TouchableOpacity>
            
            {!item.isDefault && (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setModalVisible(false);
                  handleSetDefault(item.id);
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.modalItemText}>Set as Default</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.modalItem, styles.deleteItem]}
              onPress={() => {
                setModalVisible(false);
                handleDeleteAddress(item.id);
              }}
            >
              <Ionicons name="trash" size={20} color="#F44336" />
              <Text style={[styles.modalItemText, { color: '#F44336' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const QuickAddCard = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.quickAddCard} onPress={onPress}>
      <Ionicons name={icon} size={30} color="#FF6B35" />
      <Text style={styles.quickAddText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Addresses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddAddress')}>
          <Ionicons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Add Section */}
        <View style={styles.quickAddSection}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            <QuickAddCard
              icon="home-outline"
              label="Add Home"
              onPress={() => navigation.navigate('AddAddress', { type: 'home' })}
            />
            <QuickAddCard
              icon="business-outline"
              label="Add Work"
              onPress={() => navigation.navigate('AddAddress', { type: 'work' })}
            />
            <QuickAddCard
              icon="location-outline"
              label="Add Other"
              onPress={() => navigation.navigate('AddAddress', { type: 'other' })}
            />
          </View>
        </View>

        {/* Current Addresses */}
        <View style={styles.addressesSection}>
          <Text style={styles.sectionTitle}>Your Addresses</Text>
          {addresses.map((address) => (
            <AddressCard key={address.id} item={address} />
          ))}
        </View>

        {/* Add New Address Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddAddress')}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>📍 Address Tips</Text>
          <Text style={styles.tipsText}>
            • Set a default address for faster checkout{'\n'}
            • Add clear landmarks or instructions for easy delivery{'\n'}
            • Keep your addresses up to date{'\n'}
            • You can add multiple addresses for different locations
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
  quickAddSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  quickAddGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickAddText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  addressesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  menuButton: {
    padding: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  addressActions: {
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
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
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
    minWidth: 200,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deleteItem: {
    borderBottomWidth: 0,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  tipsContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    margin: 20,
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
