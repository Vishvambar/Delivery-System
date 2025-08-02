import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logoutUser } from '../../store/slices/authSlice';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => dispatch(logoutUser())
        },
      ]
    );
  };

  const ProfileItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon} size={24} color="#FF6B35" />
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <Ionicons name="chevron-forward" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* User Info Section */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <ProfileItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Update your personal information"
          onPress={() => navigation.navigate('EditProfile')}
        />
        
        <ProfileItem
          icon="location-outline"
          title="Addresses"
          subtitle="Manage delivery addresses"
          onPress={() => navigation.navigate('AddressManagement')}
        />
        
        <ProfileItem
          icon="card-outline"
          title="Payment Methods"
          subtitle="Manage payment options"
          onPress={() => navigation.navigate('PaymentMethods')}
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <ProfileItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Push notifications for orders"
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ccc', true: '#FF6B35' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          }
        />
        
        <ProfileItem
          icon="language-outline"
          title="Language"
          subtitle="English"
          onPress={() => navigation.navigate('LanguageSettings')}
        />
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <ProfileItem
          icon="help-circle-outline"
          title="Help Center"
          subtitle="FAQs and support"
          onPress={() => navigation.navigate('HelpCenter')}
        />
        
        <ProfileItem
          icon="chatbubble-outline"
          title="Contact Us"
          subtitle="Get in touch with support"
          onPress={() => Alert.alert('Contact Support', 'Email us at support@fooddelivery.com')}
        />
        
        <ProfileItem
          icon="star-outline"
          title="Rate App"
          subtitle="Share your feedback"
          onPress={() => navigation.navigate('RateApp')}
        />
      </View>

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        
        <ProfileItem
          icon="document-text-outline"
          title="Terms of Service"
          onPress={() => Alert.alert('Terms of Service', 'By using this app, you agree to our terms and conditions.')}
        />
        
        <ProfileItem
          icon="shield-outline"
          title="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'We respect your privacy and protect your personal data.')}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  userSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
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
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 15,
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F44336',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
});
