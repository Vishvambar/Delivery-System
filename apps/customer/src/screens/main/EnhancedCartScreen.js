import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    TextInput,
    Modal,
    ScrollView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    updateDeliveryAddress
} from '../../store/slices/cartSlice';
import { api } from '../../services/api';
import { socketService } from '../../services/socketService';

export default function EnhancedCartScreen({ navigation }) {
    const dispatch = useDispatch();
    const cart = useSelector((state) => state.cart || { items: [], vendorId: null, vendorName: null, deliveryAddress: null });
    const { user } = useSelector((state) => state.auth);

    const [deliveryFee, setDeliveryFee] = useState(0);
    const [tax, setTax] = useState(0);
    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [addressForm, setAddressForm] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        instructions: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load user's saved address
        if (user?.address) {
            setAddressForm({
                street: user.address.street || '',
                city: user.address.city || '',
                state: user.address.state || '',
                zipCode: user.address.zipCode || '',
                instructions: ''
            });
            dispatch(updateDeliveryAddress({
                ...user.address,
                instructions: '',
                coordinates: user.address.coordinates || {
                    latitude: 37.7749, // Default coordinates if not available
                    longitude: -122.4194
                }
            }));
        }

        // Calculate delivery fee and tax
        calculateTotals();
    }, [cart.items]);

    const calculateTotals = () => {
        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (cart.vendorId) {
            // Placeholder delivery fee
            setDeliveryFee(2.99); 
        }

        const calculatedTax = subtotal * 0.08; // 8% tax
        setTax(calculatedTax);
    };

    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity === 0) {
            Alert.alert(
                'Remove Item',
                'Are you sure you want to remove this item from your cart?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', onPress: () => dispatch(removeFromCart(itemId)) }
                ]
            );
        } else {
            dispatch(updateCartItemQuantity({ menuItemId: itemId, quantity: newQuantity }));
        }
    };

    const handleClearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to remove all items from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', onPress: () => dispatch(clearCart()) }
            ]
        );
    };

    const handleAddressSubmit = async () => {
        if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
            Alert.alert('Error', 'Please fill in all address fields');
            return;
        }
        
        const addressWithCoordinates = {
            ...addressForm,
            coordinates: {
                latitude: 37.7749,
                longitude: -122.4194
            }
        };

        dispatch(updateDeliveryAddress(addressWithCoordinates));
        setAddressModalVisible(false);
    };

    const validateOrder = () => {
        if (cart.items.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart first');
            return false;
        }

        if (!cart.deliveryAddress || !cart.deliveryAddress.street) {
            Alert.alert('Delivery Address Required', 'Please add a delivery address');
            setAddressModalVisible(true);
            return false;
        }

        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const minimumOrder = 10;

        if (subtotal < minimumOrder) {
            Alert.alert(
                'Minimum Order Not Met',
                `Minimum order amount is $${minimumOrder.toFixed(2)}. Please add more items.`
            );
            return false;
        }

        return true;
    };

    const handleCheckout = async () => {
        if (!validateOrder()) return;

        setLoading(true);

        try {
            const orderData = {
                vendorId: cart.vendorId,
                items: cart.items.map(item => {
                    // FIX: Ensure menuItemId is correctly retrieved from the item object
                    return {
                        menuItemId: item._id, // This was likely the source of the "undefined" error
                        quantity: item.quantity,
                        specialInstructions: item.specialInstructions || ''
                    };
                }),
                deliveryAddress: cart.deliveryAddress,
                paymentMethod: paymentMethod
            };

            const response = await api.post('/orders', orderData);
            const order = response.data.data.order;

            socketService.emit('order_placed', {
                orderId: order._id,
                vendorId: cart.vendorId
            });
            socketService.emit('join_order_room', order._id);

            Alert.alert(
                'Order Placed Successfully!',
                `Your order #${order.orderNumber} has been placed. You will receive updates as your order progresses.`,
                [
                    {
                        text: 'Track Order',
                        onPress: () => {
                            dispatch(clearCart());
                            navigation.navigate('Orders', {
                                screen: 'OrderTracking',
                                params: { orderId: order._id }
                            });
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Checkout error:', error);
            // This is the correct way to handle and display a user-friendly error message from the API.
            const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
            Alert.alert('Order Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return `$${parseFloat(price || 0).toFixed(2)}`;
    };

    const getSubtotal = () => {
        return cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const getTotal = () => {
        return getSubtotal() + deliveryFee + tax;
    };
    
    // FIX: The key prop is now correctly added to the root element of the rendered component
    const renderCartItem = ({ item }) => (
        <View key={item._id} style={styles.cartItem}>
            <View style={styles.itemContent}>
                {item.image && (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                )}

                <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                        {formatPrice(item.price)}
                    </Text>
                    <Text style={styles.itemTotal}>
                        Total: {formatPrice(item.price * item.quantity)}
                    </Text>
                </View>

                <View style={styles.quantityControls}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item._id, item.quantity - 1)}
                    >
                        <Ionicons name="remove" size={16} color="#FF6B35" />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item._id, item.quantity + 1)}
                    >
                        <Ionicons name="add" size={16} color="#FF6B35" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => dispatch(removeFromCart(item._id))}
            >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
            </TouchableOpacity>
        </View>
    );

    const renderAddressModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={addressModalVisible}
            onRequestClose={() => setAddressModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Delivery Address</Text>
                        <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.inputLabel}>Street Address *</Text>
                        <TextInput
                            style={styles.input}
                            value={addressForm.street}
                            onChangeText={(text) => setAddressForm({ ...addressForm, street: text })}
                            placeholder="Enter street address"
                        />
                        <Text style={styles.inputLabel}>City *</Text>
                        <TextInput
                            style={styles.input}
                            value={addressForm.city}
                            onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
                            placeholder="Enter city"
                        />
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.inputLabel}>State *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={addressForm.state}
                                    onChangeText={(text) => setAddressForm({ ...addressForm, state: text })}
                                    placeholder="State"
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={styles.inputLabel}>ZIP Code *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={addressForm.zipCode}
                                    onChangeText={(text) => setAddressForm({ ...addressForm, zipCode: text })}
                                    placeholder="ZIP"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                        <Text style={styles.inputLabel}>Delivery Instructions</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={addressForm.instructions}
                            onChangeText={(text) => setAddressForm({ ...addressForm, instructions: text })}
                            placeholder="Special instructions for delivery (optional)"
                            multiline
                            numberOfLines={3}
                        />
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.modalSubmitButton}
                        onPress={handleAddressSubmit}
                    >
                        <Text style={styles.modalSubmitButtonText}>Save Address</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (cart.items.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Your Cart</Text>
                </View>

                <View style={styles.emptyContainer}>
                    <Ionicons name="bag-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptyText}>
                        Add some delicious items to get started
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.browseButtonText}>Browse Restaurants</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Cart</Text>
                <TouchableOpacity onPress={handleClearCart}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {cart.vendorName && (
                    <View style={styles.vendorInfo}>
                        <Ionicons name="restaurant" size={20} color="#FF6B35" />
                        <Text style={styles.vendorName}>{cart.vendorName}</Text>
                    </View>
                )}

                {/* Cart Items */}
                <View style={styles.cartItemsContainer}>
                    {cart.items.map(item => renderCartItem({ item }))}
                </View>

                {/* Delivery Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                        <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                            <Text style={styles.editText}>
                                {cart.deliveryAddress ? 'Edit' : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {cart.deliveryAddress ? (
                        <Text style={styles.addressText}>
                            {cart.deliveryAddress.street}
                            {'\n'}{cart.deliveryAddress.city}, {cart.deliveryAddress.state} {cart.deliveryAddress.zipCode}
                        </Text>
                    ) : (
                        <TouchableOpacity
                            style={styles.addAddressButton}
                            onPress={() => setAddressModalVisible(true)}
                        >
                            <Text style={styles.addAddressText}>+ Add delivery address</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentMethods}>
                        {[
                            { id: 'cash', name: 'Cash on Delivery', icon: 'cash-outline' },
                            { id: 'card', name: 'Credit/Debit Card', icon: 'card-outline' },
                            { id: 'upi', name: 'UPI', icon: 'phone-portrait-outline' }
                        ].map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.paymentMethod,
                                    paymentMethod === method.id && styles.paymentMethodSelected
                                ]}
                                onPress={() => setPaymentMethod(method.id)}
                            >
                                <Ionicons
                                    name={method.icon}
                                    size={24}
                                    color={paymentMethod === method.id ? '#FF6B35' : '#666'}
                                />
                                <Text style={[
                                    styles.paymentMethodText,
                                    paymentMethod === method.id && styles.paymentMethodTextSelected
                                ]}>
                                    {method.name}
                                </Text>
                                {paymentMethod === method.id && (
                                    <Ionicons name="checkmark-circle" size={20} color="#FF6B35" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatPrice(getSubtotal())}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee</Text>
                        <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tax</Text>
                        <Text style={styles.summaryValue}>{formatPrice(tax)}</Text>
                    </View>

                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatPrice(getTotal())}</Text>
                    </View>
                </View>

                {/* Add some bottom padding for the checkout button */}
                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Checkout Button - Fixed at bottom */}
            <View style={styles.checkoutContainer}>
                <TouchableOpacity
                    style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
                    onPress={handleCheckout}
                    disabled={loading}
                >
                    <Text style={styles.checkoutButtonText}>
                        {loading ? 'Placing Order...' : `Place Order - ${formatPrice(getTotal())}`}
                    </Text>
                </TouchableOpacity>
            </View>

            {renderAddressModal()}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    cartItemsContainer: {
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    clearText: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: '500',
    },
    vendorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
    },
    vendorName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#999',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 24,
    },
    browseButton: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    cartItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF6B35',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        paddingHorizontal: 4,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 12,
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
    },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editText: {
        color: '#FF6B35',
        fontSize: 16,
        fontWeight: '500',
    },
    addressText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    addAddressButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    addAddressText: {
        color: '#666',
        fontSize: 16,
    },
    paymentMethods: {
        marginTop: 8,
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        marginBottom: 8,
    },
    paymentMethodSelected: {
        borderColor: '#FF6B35',
        backgroundColor: '#fff5f3',
    },
    paymentMethodText: {
        fontSize: 16,
        color: '#666',
        marginLeft: 12,
        flex: 1,
    },
    paymentMethodTextSelected: {
        color: '#FF6B35',
        fontWeight: '500',
    },
    summary: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#666',
    },
    summaryValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF6B35',
    },
    checkoutContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    checkoutButton: {
        backgroundColor: '#FF6B35',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkoutButtonDisabled: {
        backgroundColor: '#ccc',
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    bottomSpacing: {
        height: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        maxHeight: 400,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        flex: 0.48,
    },
    modalSubmitButton: {
        backgroundColor: '#FF6B35',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    modalSubmitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});