import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpCenterScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  const quickActions = [
    {
      icon: 'receipt-outline',
      title: 'Track Order',
      description: 'Find your current order',
      action: () => navigation.navigate('Orders')
    },
    {
      icon: 'refresh-outline',
      title: 'Report Issue',
      description: 'Order problem or complaint',
      action: () => Alert.alert('Report Issue', 'Issue reporting feature will be available soon!')
    },
    {
      icon: 'cash-outline',
      title: 'Refund Status',
      description: 'Check refund progress',
      action: () => Alert.alert('Refund Status', 'Refund tracking feature will be available soon!')
    },
    {
      icon: 'chatbubble-outline',
      title: 'Live Chat',
      description: 'Chat with support',
      action: () => Alert.alert('Live Chat', 'Live chat feature will be available soon!')
    }
  ];

  const faqSections = [
    {
      title: 'Getting Started',
      icon: 'rocket-outline',
      faqs: [
        {
          question: 'How do I place my first order?',
          answer: 'Browse restaurants, add items to cart, provide delivery details, and choose payment method to complete your order.'
        },
        {
          question: 'How do I create an account?',
          answer: 'Tap "Sign Up" on the login screen, enter your details, and verify your phone number or email.'
        },
        {
          question: 'Is there a minimum order amount?',
          answer: 'Minimum order amounts vary by restaurant. You\'ll see the minimum amount on each restaurant\'s page.'
        }
      ]
    },
    {
      title: 'Orders & Delivery',
      icon: 'bicycle-outline',
      faqs: [
        {
          question: 'How can I track my order?',
          answer: 'Go to "Orders" tab to see real-time updates on your order status and delivery progress.'
        },
        {
          question: 'What if my order is late?',
          answer: 'Contact the restaurant or our support team. You may be eligible for a refund or credit.'
        },
        {
          question: 'Can I modify my order after placing it?',
          answer: 'Orders can only be modified immediately after placing. Contact the restaurant directly for changes.'
        },
        {
          question: 'What delivery areas do you cover?',
          answer: 'We deliver to most areas within the city. Enter your address to see available restaurants.'
        }
      ]
    },
    {
      title: 'Payments & Billing',
      icon: 'card-outline',
      faqs: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept credit/debit cards, digital wallets, and cash on delivery in select areas.'
        },
        {
          question: 'How do refunds work?',
          answer: 'Refunds are processed to your original payment method within 3-5 business days.'
        },
        {
          question: 'Why was I charged a delivery fee?',
          answer: 'Delivery fees help cover the cost of bringing food to your door. Fees vary by distance and restaurant.'
        },
        {
          question: 'Can I get a receipt for my order?',
          answer: 'Yes, receipts are automatically sent to your email and available in the Orders section.'
        }
      ]
    },
    {
      title: 'Account & Settings',
      icon: 'person-outline',
      faqs: [
        {
          question: 'How do I update my profile?',
          answer: 'Go to Profile > Edit Profile to update your personal information and preferences.'
        },
        {
          question: 'How do I change my password?',
          answer: 'Go to Profile > Edit Profile > Change Password to update your account password.'
        },
        {
          question: 'Can I save multiple addresses?',
          answer: 'Yes, you can add and manage multiple delivery addresses in Profile > Addresses.'
        },
        {
          question: 'How do I delete my account?',
          answer: 'Contact our support team to request account deletion. This action cannot be undone.'
        }
      ]
    },
    {
      title: 'Technical Issues',
      icon: 'construct-outline',
      faqs: [
        {
          question: 'The app is not working properly',
          answer: 'Try restarting the app, checking your internet connection, or updating to the latest version.'
        },
        {
          question: 'I\'m not receiving notifications',
          answer: 'Check your notification settings in the app and your device settings to ensure notifications are enabled.'
        },
        {
          question: 'Why can\'t I see any restaurants?',
          answer: 'Check your location settings and internet connection. Make sure you\'re in a supported delivery area.'
        }
      ]
    }
  ];

  const contactMethods = [
    {
      icon: 'call-outline',
      title: 'Phone Support',
      description: '1-800-FOOD-HELP',
      subtitle: 'Available 24/7',
      action: () => Linking.openURL('tel:1800364346357')
    },
    {
      icon: 'mail-outline',
      title: 'Email Support',
      description: 'support@fooddelivery.com',
      subtitle: 'Response within 24 hours',
      action: () => Linking.openURL('mailto:support@fooddelivery.com')
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Live Chat',
      description: 'Chat with our team',
      subtitle: 'Available 8 AM - 10 PM',
      action: () => Alert.alert('Live Chat', 'Live chat feature will be available soon!')
    }
  ];

  const filteredFAQs = faqSections.map(section => ({
    ...section,
    faqs: section.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.faqs.length > 0);

  const QuickActionCard = ({ item }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={item.action}>
      <Ionicons name={item.icon} size={30} color="#FF6B35" />
      <Text style={styles.quickActionTitle}>{item.title}</Text>
      <Text style={styles.quickActionDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const FAQItem = ({ faq, sectionIndex, faqIndex }) => {
    const key = `${sectionIndex}-${faqIndex}`;
    const isExpanded = expandedSection === key;

    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => setExpandedSection(isExpanded ? null : key)}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        </View>
        {isExpanded && (
          <Text style={styles.faqAnswer}>{faq.answer}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const ContactMethod = ({ item }) => (
    <TouchableOpacity style={styles.contactMethod} onPress={item.action}>
      <Ionicons name={item.icon} size={24} color="#FF6B35" />
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{item.title}</Text>
        <Text style={styles.contactDescription}>{item.description}</Text>
        <Text style={styles.contactSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for help..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} item={action} />
            ))}
          </View>
        </View>

        {/* FAQ Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {(searchQuery ? filteredFAQs : faqSections).map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.faqSection}>
              <View style={styles.faqSectionHeader}>
                <Ionicons name={section.icon} size={20} color="#FF6B35" />
                <Text style={styles.faqSectionTitle}>{section.title}</Text>
              </View>
              {section.faqs.map((faq, faqIndex) => (
                <FAQItem
                  key={faqIndex}
                  faq={faq}
                  sectionIndex={sectionIndex}
                  faqIndex={faqIndex}
                />
              ))}
            </View>
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionSubtitle}>
            Still need help? Our support team is here for you.
          </Text>
          {contactMethods.map((method, index) => (
            <ContactMethod key={index} item={method} />
          ))}
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
              <Text style={styles.appInfoValue}>January 2024</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Platform</Text>
              <Text style={styles.appInfoValue}>iOS & Android</Text>
            </View>
          </View>
        </View>

        {/* Additional Resources */}
        <View style={styles.resourcesContainer}>
          <Text style={styles.resourcesTitle}>📚 Additional Resources</Text>
          <Text style={styles.resourcesText}>
            • Check our website for detailed guides{'\n'}
            • Follow us on social media for updates{'\n'}
            • Join our community forum for tips{'\n'}
            • Watch tutorial videos on our YouTube channel
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
  placeholder: {
    width: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    paddingLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 15,
    lineHeight: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 5,
    width: '47%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  faqSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    overflow: 'hidden',
  },
  faqSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  faqSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactDescription: {
    fontSize: 14,
    color: '#FF6B35',
    marginTop: 2,
    fontWeight: '500',
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appInfo: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  resourcesContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#FFE066',
    marginBottom: 40,
  },
  resourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  resourcesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
