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

export default function RateAppScreen({ navigation }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const feedbackCategories = [
    { id: 'ui', label: 'User Interface', icon: 'phone-portrait-outline' },
    { id: 'performance', label: 'Performance', icon: 'speedometer-outline' },
    { id: 'ordering', label: 'Ordering Process', icon: 'receipt-outline' },
    { id: 'delivery', label: 'Delivery Tracking', icon: 'bicycle-outline' },
    { id: 'payment', label: 'Payment Options', icon: 'card-outline' },
    { id: 'support', label: 'Customer Support', icon: 'help-circle-outline' }
  ];

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const ratingDescriptions = {
    1: 'We\'re sorry to hear that. Your feedback helps us improve.',
    2: 'Thank you for your feedback. We\'ll work on making it better.',
    3: 'Thanks for the feedback! We\'re glad you find the app useful.',
    4: 'Great! We\'re happy you\'re enjoying the app.',
    5: 'Awesome! We\'re thrilled you love the app!'
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (rating >= 4) {
                // Prompt for app store review
                Alert.alert(
                  'Love the app?',
                  'Would you like to leave a review on the App Store?',
                  [
                    { text: 'Maybe Later', style: 'cancel' },
                    {
                      text: 'Sure!',
                      onPress: () => {
                        // In a real app, this would open the app store
                        Alert.alert('App Store', 'This would open the App Store for rating.');
                      }
                    }
                  ]
                );
              }
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = () => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          style={styles.starButton}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={40}
            color={star <= rating ? '#FFD700' : '#ddd'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const CategoryChip = ({ category, isSelected }) => (
    <TouchableOpacity
      style={[styles.categoryChip, isSelected && styles.selectedCategoryChip]}
      onPress={() => handleCategoryToggle(category.id)}
    >
      <Ionicons
        name={category.icon}
        size={16}
        color={isSelected ? 'white' : '#FF6B35'}
      />
      <Text style={[styles.categoryChipText, isSelected && styles.selectedCategoryChipText]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Our App</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* App Info Section */}
        <View style={styles.appInfoSection}>
          <View style={styles.appIcon}>
            <Ionicons name="restaurant" size={40} color="white" />
          </View>
          <Text style={styles.appName}>Food Delivery App</Text>
          <Text style={styles.appDescription}>
            Help us improve your food delivery experience
          </Text>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>How would you rate our app?</Text>
          <StarRating />
          {rating > 0 && (
            <View style={styles.ratingFeedback}>
              <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
              <Text style={styles.ratingDescription}>{ratingDescriptions[rating]}</Text>
            </View>
          )}
        </View>

        {/* Category Selection */}
        {rating > 0 && (
          <View style={styles.categoriesSection}>
            <Text style={styles.categoriesTitle}>
              What aspects would you like to comment on? (Optional)
            </Text>
            <View style={styles.categoriesGrid}>
              {feedbackCategories.map((category) => (
                <CategoryChip
                  key={category.id}
                  category={category}
                  isSelected={selectedCategories.includes(category.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Feedback Text */}
        {rating > 0 && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>
              Tell us more about your experience (Optional)
            </Text>
            <TextInput
              style={styles.feedbackInput}
              multiline
              numberOfLines={4}
              placeholder="Share your thoughts, suggestions, or report any issues..."
              value={feedback}
              onChangeText={setFeedback}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{feedback.length}/500</Text>
          </View>
        )}

        {/* Submit Button */}
        {rating > 0 && (
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitRating}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Alternative Actions */}
        <View style={styles.alternativeSection}>
          <Text style={styles.alternativeTitle}>Other Ways to Help</Text>
          
          <TouchableOpacity
            style={styles.alternativeAction}
            onPress={() => Alert.alert('App Store', 'This would open the App Store for rating.')}
          >
            <Ionicons name="star-outline" size={24} color="#FF6B35" />
            <View style={styles.alternativeText}>
              <Text style={styles.alternativeActionTitle}>Rate on App Store</Text>
              <Text style={styles.alternativeActionDescription}>
                Help others discover our app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alternativeAction}
            onPress={() => Alert.alert('Share App', 'Share feature will be available soon!')}
          >
            <Ionicons name="share-outline" size={24} color="#FF6B35" />
            <View style={styles.alternativeText}>
              <Text style={styles.alternativeActionTitle}>Share with Friends</Text>
              <Text style={styles.alternativeActionDescription}>
                Recommend us to your friends
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alternativeAction}
            onPress={() => navigation.navigate('HelpCenter')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#FF6B35" />
            <View style={styles.alternativeText}>
              <Text style={styles.alternativeActionTitle}>Get Help</Text>
              <Text style={styles.alternativeActionDescription}>
                Visit our help center
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.privacyText}>
            Your feedback is confidential and helps us improve the app experience for everyone.
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
  content: {
    flex: 1,
  },
  appInfoSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  appDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  ratingSection: {
    backgroundColor: 'white',
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    paddingHorizontal: 5,
  },
  ratingFeedback: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 5,
  },
  ratingDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  categoriesSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 20,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B35',
    backgroundColor: 'white',
    marginBottom: 10,
  },
  selectedCategoryChip: {
    backgroundColor: '#FF6B35',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#FF6B35',
    marginLeft: 6,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  feedbackSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 20,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    height: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  alternativeSection: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 10,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  alternativeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alternativeText: {
    flex: 1,
    marginLeft: 15,
  },
  alternativeActionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  alternativeActionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 15,
    margin: 20,
    borderWidth: 1,
    borderColor: '#B3E5FC',
    marginBottom: 40,
  },
  privacyText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});
