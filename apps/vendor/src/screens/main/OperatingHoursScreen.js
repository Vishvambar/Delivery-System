import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiService } from '../../services/apiService';

export default function OperatingHoursScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [operatingHours, setOperatingHours] = useState({
    monday: { isOpen: true, open: '09:00', close: '22:00' },
    tuesday: { isOpen: true, open: '09:00', close: '22:00' },
    wednesday: { isOpen: true, open: '09:00', close: '22:00' },
    thursday: { isOpen: true, open: '09:00', close: '22:00' },
    friday: { isOpen: true, open: '09:00', close: '23:00' },
    saturday: { isOpen: true, open: '10:00', close: '23:00' },
    sunday: { isOpen: true, open: '10:00', close: '21:00' }
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load current operating hours from backend
  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await apiService.get('/vendors?includeAll=true');
        const data = response.data;
        
        // Handle different response formats
        let vendors = [];
        if (data.data && data.data.vendors && Array.isArray(data.data.vendors)) {
          vendors = data.data.vendors;
        } else if (data.data && Array.isArray(data.data)) {
          vendors = data.data;
        } else if (data.success && Array.isArray(data.vendors)) {
          vendors = data.vendors;
        } else if (Array.isArray(data)) {
          vendors = data;
        }
        
        const userVendor = vendors.find(vendor => {
          const vendorUserId = vendor.userId?._id || vendor.userId;
          return vendorUserId === user._id;
        });
        
        if (userVendor && userVendor.operatingHours) {
          // Convert backend format to component format
          const convertedHours = {};
          Object.keys(userVendor.operatingHours).forEach(day => {
            const dayData = userVendor.operatingHours[day];
            convertedHours[day] = {
              isOpen: Boolean(dayData.open && dayData.close),
              open: dayData.open || '09:00',
              close: dayData.close || '22:00'
            };
          });
          setOperatingHours(convertedHours);
        }
      } catch (error) {
        console.error('❌ Error fetching vendor profile:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (user?._id) {
      fetchVendorProfile();
    }
  }, [user]);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00', '23:30', '00:00'
  ];

  const updateDayStatus = (day, isOpen) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isOpen }
    }));
  };

  const updateDayTime = (day, timeType, time) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [timeType]: time }
    }));
  };

  const setAllDaysSame = () => {
    Alert.alert(
      'Set All Days',
      'Apply Monday\'s hours to all days?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            const mondayHours = operatingHours.monday;
            const newHours = {};
            daysOfWeek.forEach(day => {
              newHours[day.key] = { ...mondayHours };
            });
            setOperatingHours(newHours);
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    // Validate that open time is before close time for each open day
    for (const day of daysOfWeek) {
      const dayData = operatingHours[day.key];
      if (dayData.isOpen && dayData.open >= dayData.close) {
        Alert.alert('Error', `${day.label}: Opening time must be before closing time`);
        return;
      }
    }

    setLoading(true);
    
    try {
      // Convert component format to backend format
      const backendFormat = {};
      Object.keys(operatingHours).forEach(day => {
        const dayData = operatingHours[day];
        backendFormat[day] = {
          open: dayData.isOpen ? dayData.open : null,
          close: dayData.isOpen ? dayData.close : null
        };
      });

      const response = await apiService.put('/vendors/profile', {
        operatingHours: backendFormat
      });

      if (response.data.success) {
        Alert.alert('Success', 'Operating hours updated successfully!');
        navigation.goBack();
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Error saving operating hours:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save operating hours';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const TimeSelector = ({ label, value, onValueChange, disabled }) => (
    <View style={styles.timeSelector}>
      <Text style={[styles.timeSelectorLabel, disabled && styles.disabledText]}>{label}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.timeScrollView}
      >
        {timeSlots.map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeSlot,
              value === time && styles.timeSlotActive,
              disabled && styles.timeSlotDisabled
            ]}
            onPress={() => !disabled && onValueChange(time)}
            disabled={disabled}
          >
            <Text style={[
              styles.timeSlotText,
              value === time && styles.timeSlotTextActive,
              disabled && styles.disabledText
            ]}>
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const DayRow = ({ day, dayData }) => (
    <View style={styles.dayContainer}>
      <View style={styles.dayHeader}>
        <View style={styles.dayInfo}>
          <Text style={styles.dayLabel}>{day.label}</Text>
          <Text style={styles.dayStatus}>
            {dayData.isOpen 
              ? `${dayData.open} - ${dayData.close}` 
              : 'Closed'
            }
          </Text>
        </View>
        <Switch
          value={dayData.isOpen}
          onValueChange={(value) => updateDayStatus(day.key, value)}
          trackColor={{ false: '#ccc', true: '#FF6B35' }}
          thumbColor={dayData.isOpen ? '#fff' : '#f4f3f4'}
        />
      </View>

      {dayData.isOpen && (
        <View style={styles.timeContainer}>
          <TimeSelector
            label="Opening Time"
            value={dayData.open}
            onValueChange={(time) => updateDayTime(day.key, 'open', time)}
          />
          <TimeSelector
            label="Closing Time"
            value={dayData.close}
            onValueChange={(time) => updateDayTime(day.key, 'close', time)}
          />
        </View>
      )}
    </View>
  );

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading operating hours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickActionButton} onPress={setAllDaysSame}>
            <Ionicons name="copy-outline" size={20} color="#FF6B35" />
            <Text style={styles.quickActionText}>Apply Monday to All Days</Text>
          </TouchableOpacity>
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          {daysOfWeek.map((day) => (
            <DayRow
              key={day.key}
              day={day}
              dayData={operatingHours[day.key]}
            />
          ))}
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Notes</Text>
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.noteText}>
              Changes to operating hours will be reflected immediately for new orders. 
              Existing orders will not be affected.
            </Text>
          </View>
          <View style={styles.noteContainer}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.noteText}>
              Make sure your operating hours align with your kitchen capacity and delivery schedule.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Operating Hours</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#FFF3F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0D6',
  },
  quickActionText: {
    fontSize: 16,
    color: '#FF6B35',
    marginLeft: 10,
    fontWeight: '500',
  },
  dayContainer: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dayInfo: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dayStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timeContainer: {
    marginTop: 10,
  },
  timeSelector: {
    marginBottom: 15,
  },
  timeSelectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  timeScrollView: {
    marginHorizontal: -5,
  },
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  timeSlotActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  timeSlotDisabled: {
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#666',
  },
  timeSlotTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  disabledText: {
    color: '#ccc',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
