import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpCenterScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'rocket-outline',
      color: '#4CAF50',
      faqs: [
        {
          id: 1,
          question: 'How do I set up my restaurant profile?',
          answer: 'Go to Profile > Restaurant Details to update your business information, including name, category, cuisine type, and location. Make sure all information is accurate as it helps customers find you.'
        },
        {
          id: 2,
          question: 'How do I add menu items?',
          answer: 'Navigate to the Menu tab, then tap the "+" button to add new items. Include clear descriptions, accurate prices, and high-quality photos to attract customers.'
        },
        {
          id: 3,
          question: 'How do I set my operating hours?',
          answer: 'Go to Profile > Operating Hours to set your daily schedule. You can set different hours for each day and mark days when you\'re closed.'
        }
      ]
    },
    {
      id: 'orders',
      title: 'Order Management',
      icon: 'receipt-outline',
      color: '#2196F3',
      faqs: [
        {
          id: 4,
          question: 'How do I accept or reject orders?',
          answer: 'When you receive a new order notification, tap on it to view details. You can accept the order to start preparation or reject it if you\'re unable to fulfill it.'
        },
        {
          id: 5,
          question: 'How long do I have to respond to orders?',
          answer: 'You have 5 minutes to respond to new orders. If you don\'t respond within this time, the order will be automatically cancelled.'
        },
        {
          id: 6,
          question: 'Can I modify order preparation time?',
          answer: 'Yes, you can update the estimated preparation time when accepting an order. This helps set accurate expectations for customers and delivery partners.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Earnings',
      icon: 'cash-outline',
      color: '#FF9800',
      faqs: [
        {
          id: 7,
          question: 'When do I get paid?',
          answer: 'Payments are processed weekly every Tuesday. Earnings from the previous week (Monday to Sunday) will be transferred to your registered bank account.'
        },
        {
          id: 8,
          question: 'What are the commission rates?',
          answer: 'The platform charges a 15% commission on each order. This covers payment processing, customer support, and app maintenance costs.'
        },
        {
          id: 9,
          question: 'How can I track my earnings?',
          answer: 'Go to Profile > Sales Report to view detailed analytics including daily, weekly, and monthly earnings, along with order statistics.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: 'construct-outline',
      color: '#9C27B0',
      faqs: [
        {
          id: 10,
          question: 'The app is not working properly, what should I do?',
          answer: 'Try force-closing and reopening the app first. If issues persist, check your internet connection and update to the latest app version. Contact support if problems continue.'
        },
        {
          id: 11,
          question: 'I\'m not receiving order notifications',
          answer: 'Ensure notifications are enabled in your device settings for the vendor app. Also check that you\'re logged in and your restaurant status is set to "Open".'
        },
        {
          id: 12,
          question: 'How do I update my menu photos?',
          answer: 'Go to Menu > select the item > tap the photo > choose "Update Photo". Use high-quality images with good lighting for best results.'
        }
      ]
    },
    {
      id: 'policies',
      title: 'Policies & Guidelines',
      icon: 'document-text-outline',
      color: '#F44336',
      faqs: [
        {
          id: 13,
          question: 'What are the food safety requirements?',
          answer: 'All vendors must maintain proper food safety standards, including valid food handling licenses, clean preparation areas, and proper food storage temperatures.'
        },
        {
          id: 14,
          question: 'Can I refuse certain orders?',
          answer: 'You can reject orders, but excessive rejections may affect your vendor rating. Valid reasons include ingredient unavailability or technical issues.'
        },
        {
          id: 15,
          question: 'What happens if I receive a complaint?',
          answer: 'Customer complaints are reviewed by our support team. We\'ll contact you to understand the situation and work together to resolve any issues.'
        }
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      subtitle: 'Get help from our team',
      icon: 'chatbubble-ellipses-outline',
      color: '#FF6B35',
      action: () => Alert.alert('Contact Support', 'Email: vendor-support@fooddelivery.com\nPhone: 1-800-VENDOR-1')
    },
    {
      title: 'Report an Issue',
      subtitle: 'Technical problems or bugs',
      icon: 'bug-outline',
      color: '#F44336',
      action: () => Alert.alert('Report Issue', 'Please email us at tech-support@fooddelivery.com with details about the issue.')
    },
    {
      title: 'Vendor Resources',
      subtitle: 'Best practices and guides',
      icon: 'library-outline',
      color: '#2196F3',
      action: () => Alert.alert('Resources', 'Visit our vendor portal at vendors.fooddelivery.com for additional resources.')
    },
    {
      title: 'Community Forum',
      subtitle: 'Connect with other vendors',
      icon: 'people-outline',
      color: '#4CAF50',
      action: () => Alert.alert('Forum', 'Join our vendor community at community.fooddelivery.com')
    }
  ];

  const filteredFAQs = () => {
    if (!searchQuery.trim()) return [];
    
    const results = [];
    helpCategories.forEach(category => {
      category.faqs.forEach(faq => {
        if (
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          results.push({ ...faq, categoryTitle: category.title });
        }
      });
    });
    return results;
  };

  const QuickActionCard = ({ title, subtitle, icon, color, action }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={action}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const CategorySection = ({ category }) => (
    <View style={styles.categoryContainer}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => setExpandedCategory(
          expandedCategory === category.id ? null : category.id
        )}
      >
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <Ionicons name={category.icon} size={20} color="white" />
          </View>
          <Text style={styles.categoryTitle}>{category.title}</Text>
        </View>
        <Ionicons
          name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {expandedCategory === category.id && (
        <View style={styles.faqList}>
          {category.faqs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => setExpandedFAQ(
                  expandedFAQ === faq.id ? null : faq.id
                )}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons
                  name={expandedFAQ === faq.id ? 'remove' : 'add'}
                  size={20}
                  color="#FF6B35"
                />
              </TouchableOpacity>
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const SearchResults = () => {
    const results = filteredFAQs();
    
    if (results.length === 0) {
      return (
        <View style={styles.noResults}>
          <Ionicons name="search" size={48} color="#ccc" />
          <Text style={styles.noResultsText}>No results found</Text>
          <Text style={styles.noResultsSubtext}>
            Try different keywords or browse categories below
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.searchResults}>
        <Text style={styles.searchResultsTitle}>
          {results.length} result{results.length > 1 ? 's' : ''} found
        </Text>
        {results.map((faq) => (
          <View key={faq.id} style={styles.searchResultItem}>
            <Text style={styles.searchResultCategory}>{faq.categoryTitle}</Text>
            <Text style={styles.searchResultQuestion}>{faq.question}</Text>
            <Text style={styles.searchResultAnswer}>{faq.answer}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results or Categories */}
        {searchQuery.trim() ? (
          <View style={styles.section}>
            <SearchResults />
          </View>
        ) : (
          <>
            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              {quickActions.map((action, index) => (
                <QuickActionCard key={index} {...action} />
              ))}
            </View>

            {/* FAQ Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              {helpCategories.map((category) => (
                <CategorySection key={category.id} category={category} />
              ))}
            </View>
          </>
        )}

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need More Help?</Text>
          
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Still have questions?</Text>
            <Text style={styles.contactText}>
              Our vendor support team is here to help you succeed. We typically respond within 24 hours.
            </Text>
            
            <View style={styles.contactMethods}>
              <TouchableOpacity 
                style={styles.contactMethod}
                onPress={() => Linking.openURL('mailto:vendor-support@fooddelivery.com')}
              >
                <Ionicons name="mail" size={20} color="#FF6B35" />
                <Text style={styles.contactMethodText}>vendor-support@fooddelivery.com</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.contactMethod}
                onPress={() => Linking.openURL('tel:+1-800-836-3671')}
              >
                <Ionicons name="call" size={20} color="#FF6B35" />
                <Text style={styles.contactMethodText}>1-800-VENDOR-1</Text>
              </TouchableOpacity>
              
              <View style={styles.contactMethod}>
                <Ionicons name="time" size={20} color="#FF6B35" />
                <Text style={styles.contactMethodText}>Mon-Fri, 9 AM - 6 PM EST</Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.appInfo}>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Version</Text>
              <Text style={styles.appInfoValue}>1.0.0</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Last Updated</Text>
              <Text style={styles.appInfoValue}>January 2025</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Platform</Text>
              <Text style={styles.appInfoValue}>Vendor Portal</Text>
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
  searchContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
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
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  categoryContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  faqList: {
    backgroundColor: 'white',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  faqQuestionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#fafafa',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  searchResults: {
    paddingTop: 10,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  searchResultItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  searchResultCategory: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
    marginBottom: 5,
  },
  searchResultQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  searchResultAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#999',
    marginTop: 15,
    fontWeight: '500',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactMethods: {
    gap: 12,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactMethodText: {
    fontSize: 14,
    color: '#FF6B35',
    marginLeft: 10,
    fontWeight: '500',
  },
  appInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  appInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});
