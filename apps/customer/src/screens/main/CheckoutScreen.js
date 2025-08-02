import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { placeOrder } from '../../store/slices/orderSlice';
import { clearCart } from '../../store/slices/cartSlice';

export default function CheckoutScreen({ navigation }) {
  const dispatch = useDispatch();
  const { items, total } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.orders);
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    instructions: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [errors, setErrors] = useState({});

  const deliveryFee = 2.99;
  const tax = total * 0.08; // 8% tax
  const finalTotal = total + deliveryFee + tax;
  const minimumOrderAmount = 15.00;

  useEffect(() => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    }
  }, [items.length, navigation]);

  const validateForm = () => {
    const newErrors = {};

    if (!deliveryInfo.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!deliveryInfo.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!deliveryInfo.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!deliveryInfo.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill in all required delivery information');
      return;
    }

    // Check minimum order amount
    if (total < minimumOrderAmount) {
      Alert.alert(
        'Minimum Order Required',
        `Your order total ($${total.toFixed(2)}) is below the minimum order amount of $${minimumOrderAmount.toFixed(2)}. Please add more items to your cart.`,
        [
          { text: 'Continue Shopping', onPress: () => navigation.navigate('Home') },
          { text: 'OK' }
        ]
      );
      return;
    }

    try {
      // Get vendor info from first item (assuming all items are from same vendor)
      const vendorId = items[0]?.vendorId || '688c90a002ecd124ee7ce6ec';
      
      const orderData = {
        customerId: user._id,
        vendorId: vendorId,
        items: items.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.instructions || ''
        })),
        deliveryAddress: {
          street: deliveryInfo.street,
          city: deliveryInfo.city,
          state: deliveryInfo.state,
          zipCode: deliveryInfo.zipCode,
          instructions: deliveryInfo.instructions,
          coordinates: {
            latitude: user?.address?.coordinates?.latitude || 37.7749,
            longitude: user?.address?.coordinates?.longitude || -122.4194
          }
        },
        pricing: {
          subtotal: total,
          deliveryFee: deliveryFee,
          tax: tax,
          discount: 0,
          total: finalTotal
        },
        paymentMethod: paymentMethod,
        paymentStatus: 'pending',
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      };

      console.log('🛒 Placing order:', orderData);
      
      const result = await dispatch(placeOrder(orderData)).unwrap();
      
      // Clear cart after successful order
      dispatch(clearCart());
      
      Alert.alert(
        'Order Placed!',
        `Your order #${result.orderNumber || result._id} has been placed successfully. You can track it in the Orders tab.`,
        [
          {
            text: 'Track Order',
            onPress: () => navigation.navigate('Orders', { 
              screen: 'OrderTracking', 
              params: { orderId: result._id } 
            })
          },
          {
            text: 'Continue Shopping',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Order placement failed:', error);
      Alert.alert(
        'Order Failed',
        error || 'Failed to place order. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const FormField = ({ label, value, onChangeText, placeholder, error, multiline = false }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, error && styles.textInputError, multiline && styles.textInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const PaymentMethodSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Method</Text>
      {[
        { value: 'card', label: 'Credit/Debit Card', icon: 'card-outline' },
        { value: 'cash', label: 'Cash on Delivery', icon: 'cash-outline' },
        { value: 'upi', label: 'UPI/Digital Wallet', icon: 'phone-portrait-outline' }
      ].map((method) => (
        <TouchableOpacity
          key={method.value}
          style={[
            styles.paymentOption,
            paymentMethod === method.value && styles.selectedPaymentOption
          ]}
          onPress={() => setPaymentMethod(method.value)}
        >
          <Ionicons name={method.icon} size={24} color={paymentMethod === method.value ? '#FF6B35' : '#666'} />
          <Text style={[
            styles.paymentLabel,
            paymentMethod === method.value && styles.selectedPaymentLabel
          ]}>
            {method.label}
          </Text>
          {paymentMethod === method.value && (
            <Ionicons name="checkmark-circle" size={20} color="#FF6B35" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                {item.quantity} × ${item.price.toFixed(2)}
              </Text>
              <Text style={styles.itemTotal}>
                ${(item.quantity * item.price).toFixed(2)}
              </Text>
            </View>
          ))}
          
          <View style={styles.separator} />
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Subtotal</Text>
            <Text style={styles.costValue}>${total.toFixed(2)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Delivery Fee</Text>
            <Text style={styles.costValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Tax</Text>
            <Text style={styles.costValue}>${tax.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.costRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
          </View>

          {/* Minimum Order Warning */}
          {total < minimumOrderAmount && (
            <View style={styles.minimumOrderWarning}>
              <Ionicons name="warning-outline" size={16} color="#FF9800" />
              <Text style={styles.minimumOrderText}>
                Minimum order: ${minimumOrderAmount.toFixed(2)} • Add ${(minimumOrderAmount - total).toFixed(2)} more
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          
          <FormField
            label="Street Address *"
            value={deliveryInfo.street}
            onChangeText={(text) => setDeliveryInfo(prev => ({ ...prev, street: text }))}
            placeholder="Enter your street address"
            error={errors.street}
          />
          
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <FormField
                label="City *"
                value={deliveryInfo.city}
                onChangeText={(text) => setDeliveryInfo(prev => ({ ...prev, city: text }))}
                placeholder="City"
                error={errors.city}
              />
            </View>
            <View style={styles.halfField}>
              <FormField
                label="State *"
                value={deliveryInfo.state}
                onChangeText={(text) => setDeliveryInfo(prev => ({ ...prev, state: text }))}
                placeholder="State"
                error={errors.state}
              />
            </View>
          </View>
          
          <FormField
            label="ZIP Code *"
            value={deliveryInfo.zipCode}
            onChangeText={(text) => setDeliveryInfo(prev => ({ ...prev, zipCode: text }))}
            placeholder="12345"
            error={errors.zipCode}
          />
          
          <FormField
            label="Delivery Instructions (Optional)"
            value={deliveryInfo.instructions}
            onChangeText={(text) => setDeliveryInfo(prev => ({ ...prev, instructions: text }))}
            placeholder="Any special instructions for delivery..."
            multiline
          />
        </View>

        {/* Payment Method */}
        <PaymentMethodSelector />

        {/* Estimated Delivery */}
        <View style={styles.section}>
          <View style={styles.estimationRow}>
            <Ionicons name="time-outline" size={20} color="#FF6B35" />
            <Text style={styles.estimationText}>
              Estimated delivery: 25-35 minutes
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.placeOrderButton, 
            (loading || total < minimumOrderAmount) && styles.placeOrderButtonDisabled
          ]} 
          onPress={handlePlaceOrder}
          disabled={loading || total < minimumOrderAmount}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              {total < minimumOrderAmount 
                ? `Add $${(minimumOrderAmount - total).toFixed(2)} more` 
                : `Place Order • $${finalTotal.toFixed(2)}`
              }
            </Text>
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
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
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
    fontSize: 12,
    marginTop: 5,
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    width: '48%',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  selectedPaymentOption: {
    backgroundColor: '#FFF3F0',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  paymentLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  selectedPaymentLabel: {
    color: '#FF6B35',
    fontWeight: '500',
  },
  estimationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeOrderButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  minimumOrderWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  minimumOrderText: {
    fontSize: 14,
    color: '#FF8F00',
    marginLeft: 8,
    fontWeight: '500',
  },
});
