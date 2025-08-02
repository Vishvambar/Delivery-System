import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SalesReportScreen({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Mock data - in real app this would come from API
  const salesData = {
    week: {
      totalRevenue: 1850.25,
      totalOrders: 47,
      averageOrderValue: 39.36,
      topSellingItem: 'Margherita Pizza',
      dailyData: [
        { day: 'Mon', orders: 8, revenue: 312.50 },
        { day: 'Tue', orders: 6, revenue: 234.75 },
        { day: 'Wed', orders: 9, revenue: 365.25 },
        { day: 'Thu', orders: 7, revenue: 289.00 },
        { day: 'Fri', orders: 12, revenue: 468.50 },
        { day: 'Sat', orders: 3, revenue: 123.25 },
        { day: 'Sun', orders: 2, revenue: 57.00 }
      ]
    },
    month: {
      totalRevenue: 8250.75,
      totalOrders: 189,
      averageOrderValue: 43.65,
      topSellingItem: 'Pepperoni Pizza',
      dailyData: [] // Would contain 30 days of data
    },
    year: {
      totalRevenue: 98500.25,
      totalOrders: 2156,
      averageOrderValue: 45.70,
      topSellingItem: 'Classic Burger',
      dailyData: [] // Would contain 12 months of data
    }
  };

  const currentData = salesData[selectedPeriod];
  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' }
  ];

  const topSellingItems = [
    { name: 'Margherita Pizza', orders: 23, revenue: 460.00, percentage: 24.9 },
    { name: 'Pepperoni Pizza', orders: 18, revenue: 378.00, percentage: 20.4 },
    { name: 'Caesar Salad', orders: 15, revenue: 225.00, percentage: 12.2 },
    { name: 'Garlic Bread', orders: 12, revenue: 96.00, percentage: 6.5 },
    { name: 'Chicken Wings', orders: 10, revenue: 150.00, percentage: 8.1 }
  ];

  const recentTransactions = [
    { id: '#ORD001', time: '2 hours ago', amount: 42.50, items: 2, status: 'completed' },
    { id: '#ORD002', time: '3 hours ago', amount: 28.75, items: 1, status: 'completed' },
    { id: '#ORD003', time: '4 hours ago', amount: 65.25, items: 3, status: 'completed' },
    { id: '#ORD004', time: '5 hours ago', amount: 33.00, items: 2, status: 'completed' },
    { id: '#ORD005', time: '6 hours ago', amount: 48.50, items: 2, status: 'refunded' }
  ];

  const StatCard = ({ title, value, subtitle, icon, color, growth }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
          {growth && (
            <View style={styles.growthContainer}>
              <Ionicons 
                name={growth > 0 ? "trending-up" : "trending-down"} 
                size={14} 
                color={growth > 0 ? "#4CAF50" : "#F44336"} 
              />
              <Text style={[
                styles.growthText, 
                { color: growth > 0 ? "#4CAF50" : "#F44336" }
              ]}>
                {Math.abs(growth)}% from last {selectedPeriod}
              </Text>
            </View>
          )}
        </View>
        <Ionicons name={icon} size={28} color={color} />
      </View>
    </View>
  );

  const ChartBar = ({ day, orders, revenue, maxRevenue }) => {
    const height = (revenue / maxRevenue) * 80;
    return (
      <View style={styles.chartBar}>
        <View style={styles.barContainer}>
          <View style={[styles.bar, { height: height || 2 }]} />
        </View>
        <Text style={styles.barLabel}>{day}</Text>
        <Text style={styles.barValue}>{orders}</Text>
      </View>
    );
  };

  const maxRevenue = Math.max(...currentData.dailyData.map(d => d.revenue));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          
          <StatCard
            title="Total Revenue"
            value={`$${(currentData.totalRevenue || 0).toFixed(2)}`}
            icon="cash-outline"
            color="#4CAF50"
            growth={12.5}
          />
          
          <StatCard
            title="Total Orders"
            value={currentData.totalOrders}
            icon="receipt-outline"
            color="#2196F3"
            growth={8.3}
          />
          
          <StatCard
            title="Average Order Value"
            value={`$${(currentData.averageOrderValue || 0).toFixed(2)}`}
            icon="trending-up-outline"
            color="#FF9800"
            growth={-2.1}
          />
          
          <StatCard
            title="Top Selling Item"
            value={currentData.topSellingItem}
            icon="star-outline"
            color="#9C27B0"
          />
        </View>

        {/* Orders Chart */}
        {selectedPeriod === 'week' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Orders</Text>
            <View style={styles.chartContainer}>
              {currentData.dailyData.map((data, index) => (
                <ChartBar
                  key={index}
                  day={data.day}
                  orders={data.orders}
                  revenue={data.revenue}
                  maxRevenue={maxRevenue}
                />
              ))}
            </View>
            <Text style={styles.chartNote}>Number of orders per day</Text>
          </View>
        )}

        {/* Top Selling Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          {topSellingItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemStats}>
                  {item.orders} orders • ${(item.revenue || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.itemPercentage}>
                <Text style={styles.percentageText}>{item.percentage}%</Text>
                <View style={styles.percentageBar}>
                  <View style={[styles.percentageFill, { width: `${item.percentage}%` }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.map((transaction, index) => (
            <View key={index} style={styles.transactionRow}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionId}>{transaction.id}</Text>
                <Text style={styles.transactionTime}>{transaction.time}</Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionAmount}>
                  ${(transaction.amount || 0).toFixed(2)}
                </Text>
                <Text style={styles.transactionItems}>
                  {transaction.items} item{transaction.items > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                transaction.status === 'completed' ? styles.statusCompleted : styles.statusRefunded
              ]}>
                <Text style={[
                  styles.statusText,
                  transaction.status === 'completed' ? styles.statusTextCompleted : styles.statusTextRefunded
                ]}>
                  {transaction.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          
          <View style={styles.insightCard}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Peak Hours</Text>
              <Text style={styles.insightText}>
                Most orders come in between 6:00 PM - 8:00 PM. Consider special promotions during this time.
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Ionicons name="restaurant" size={24} color="#FF9800" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Menu Optimization</Text>
              <Text style={styles.insightText}>
                Pizza items account for 45% of your revenue. Consider expanding your pizza menu.
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Ionicons name="star" size={24} color="#2196F3" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Customer Satisfaction</Text>
              <Text style={styles.insightText}>
                Your average rating of 4.3 stars is above average. Keep maintaining quality!
              </Text>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 15,
    padding: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  periodButtonActive: {
    backgroundColor: '#FF6B35',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: 'white',
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
  statCard: {
    borderLeftWidth: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  growthText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginVertical: 20,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 80,
    width: 20,
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  bar: {
    backgroundColor: '#FF6B35',
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  chartNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemPercentage: {
    alignItems: 'flex-end',
    width: 80,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  percentageBar: {
    width: 60,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
  },
  percentageFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDetails: {
    alignItems: 'flex-end',
    marginRight: 15,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionItems: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E8',
  },
  statusRefunded: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextCompleted: {
    color: '#4CAF50',
  },
  statusTextRefunded: {
    color: '#F44336',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  insightContent: {
    flex: 1,
    marginLeft: 15,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
