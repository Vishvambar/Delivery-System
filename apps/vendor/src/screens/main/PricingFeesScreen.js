import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiService } from '../../services/apiService';

export default function PricingFeesScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [pricingData, setPricingData] = useState({
    deliveryFee: '2.99',
    minimumOrder: '15.00',
    serviceFeePercentage: '3.5',
    dynamicPricing: false,
    freeDeliveryThreshold: '25.00',
    peakHourSurcharge: '1.50',
    enablePeakHours: false,
    peakHours: {
      start: '18:00',
      end: '21:00'
    }
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load current pricing settings from backend
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
        
        if (userVendor) {
          setPricingData(prev => ({
            ...prev,
            deliveryFee: userVendor.deliveryFee?.toString() || '2.99',
            minimumOrder: userVendor.minimumOrder?.toString() || '15.00',
          }));
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

  const updateField = (field, value) => {
    setPricingData(prev => ({ ...prev, [field]: value }));
  };

  const updatePeakHours = (field, value) => {
    setPricingData(prev => ({
      ...prev,
      peakHours: { ...prev.peakHours, [field]: value }
    }));
  };

  const validatePricing = () => {
    const { deliveryFee, minimumOrder, freeDeliveryThreshold, peakHourSurcharge } = pricingData;
    
    if (parseFloat(deliveryFee) < 0 || parseFloat(deliveryFee) > 10) {
      Alert.alert('Error', 'Delivery fee must be between $0.00 and $10.00');
      return false;
    }
    
    if (parseFloat(minimumOrder) < 5 || parseFloat(minimumOrder) > 100) {
      Alert.alert('Error', 'Minimum order must be between $5.00 and $100.00');
      return false;
    }
    
    if (parseFloat(freeDeliveryThreshold) < parseFloat(minimumOrder)) {
      Alert.alert('Error', 'Free delivery threshold must be higher than minimum order amount');
      return false;
    }
    
    if (pricingData.enablePeakHours && parseFloat(peakHourSurcharge) < 0) {
      Alert.alert('Error', 'Peak hour surcharge cannot be negative');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validatePricing()) return;

    setLoading(true);
    
    try {
      const response = await apiService.put('/vendors/profile', {
        deliveryFee: parseFloat(pricingData.deliveryFee),
        minimumOrder: parseFloat(pricingData.minimumOrder),
      });

      if (response.data.success) {
        Alert.alert('Success', 'Pricing and fees updated successfully!');
        navigation.goBack();
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Error saving pricing settings:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save pricing settings';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, prefix = '$', suffix, keyboardType = 'numeric', ...props }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, prefix && styles.inputWithPrefix]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          {...props}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );

  const ToggleSection = ({ title, description, value, onValueChange, children }) => (
    <View style={styles.toggleSection}>
      <View style={styles.toggleHeader}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleDescription}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#ccc', true: '#FF6B35' }}
          thumbColor={value ? '#fff' : '#f4f3f4'}
        />
      </View>
      {value && children}
    </View>
  );

  const calculateEstimatedRevenue = () => {
    const avgOrderValue = 22.50;
    const ordersPerDay = 12;
    const serviceFee = (avgOrderValue * parseFloat(pricingData.serviceFeePercentage)) / 100;
    const dailyRevenue = (avgOrderValue - serviceFee) * ordersPerDay;
    const monthlyRevenue = dailyRevenue * 30;
    
    return { dailyRevenue, monthlyRevenue, serviceFee };
  };

  const { dailyRevenue, monthlyRevenue, serviceFee } = calculateEstimatedRevenue();

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading pricing settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Pricing</Text>
          
          <InputField
            label="Delivery Fee"
            value={pricingData.deliveryFee}
            onChangeText={(value) => updateField('deliveryFee', value)}
            placeholder="2.99"
          />

          <InputField
            label="Minimum Order Amount"
            value={pricingData.minimumOrder}
            onChangeText={(value) => updateField('minimumOrder', value)}
            placeholder="15.00"
          />

          <InputField
            label="Service Fee Percentage"
            value={pricingData.serviceFeePercentage}
            onChangeText={(value) => updateField('serviceFeePercentage', value)}
            placeholder="3.5"
            prefix=""
            suffix="%"
          />
        </View>

        {/* Free Delivery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Free Delivery</Text>
          
          <InputField
            label="Free Delivery Threshold"
            value={pricingData.freeDeliveryThreshold}
            onChangeText={(value) => updateField('freeDeliveryThreshold', value)}
            placeholder="25.00"
          />
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Orders above this amount will have free delivery. This can increase average order value.
            </Text>
          </View>
        </View>

        {/* Peak Hours Pricing */}
        <View style={styles.section}>
          <ToggleSection
            title="Peak Hours Surcharge"
            description="Add extra fee during busy hours"
            value={pricingData.enablePeakHours}
            onValueChange={(value) => updateField('enablePeakHours', value)}
          >
            <View style={styles.peakHoursContainer}>
              <InputField
                label="Peak Hour Surcharge"
                value={pricingData.peakHourSurcharge}
                onChangeText={(value) => updateField('peakHourSurcharge', value)}
                placeholder="1.50"
              />
              
              <View style={styles.timeRangeContainer}>
                <Text style={styles.label}>Peak Hours</Text>
                <View style={styles.timeRange}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>From</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={pricingData.peakHours.start}
                      onChangeText={(value) => updatePeakHours('start', value)}
                      placeholder="18:00"
                    />
                  </View>
                  <Text style={styles.timeSeparator}>to</Text>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>To</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={pricingData.peakHours.end}
                      onChangeText={(value) => updatePeakHours('end', value)}
                      placeholder="21:00"
                    />
                  </View>
                </View>
              </View>
            </View>
          </ToggleSection>
        </View>

        {/* Revenue Estimate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Estimate</Text>
          
          <View style={styles.revenueCard}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Platform Service Fee</Text>
              <Text style={styles.revenueValue}>-${(serviceFee || 0).toFixed(2)} per order</Text>
            </View>
            
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Estimated Daily Revenue</Text>
              <Text style={styles.revenueValue}>${(dailyRevenue || 0).toFixed(2)}</Text>
            </View>
            
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Estimated Monthly Revenue</Text>
              <Text style={[styles.revenueValue, styles.monthlyRevenue]}>
                ${(monthlyRevenue || 0).toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.disclaimerBox}>
            <Ionicons name="alert-circle" size={16} color="#FF9800" />
            <Text style={styles.disclaimerText}>
              *Estimates based on average order value of $22.50 and 12 orders per day
            </Text>
          </View>
        </View>

        {/* Pricing Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Tips</Text>
          
          <View style={styles.tipContainer}>
            <Ionicons name="bulb" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Keep delivery fees competitive. High delivery fees can reduce order frequency.
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Ionicons name="trending-up" size={20} color="#2196F3" />
            <Text style={styles.tipText}>
              Free delivery thresholds can increase average order values by 15-25%.
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.tipText}>
              Peak hour surcharges help manage demand during busy periods.
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
              <Text style={styles.saveButtonText}>Save Pricing</Text>
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputWithPrefix: {
    paddingLeft: 0,
  },
  inputPrefix: {
    paddingLeft: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  inputSuffix: {
    paddingRight: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  toggleSection: {
    marginBottom: 20,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  peakHoursContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timeRangeContainer: {
    marginTop: 10,
  },
  timeRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 15,
    marginTop: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  revenueCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  monthlyRevenue: {
    color: '#4CAF50',
    fontSize: 18,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 6,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#F57F17',
    marginLeft: 5,
    flex: 1,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  tipText: {
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
