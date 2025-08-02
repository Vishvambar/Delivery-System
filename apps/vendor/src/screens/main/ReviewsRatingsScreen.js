import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewsRatingsScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [showReplyFor, setShowReplyFor] = useState(null);

  // Mock reviews data
  const reviewsData = {
    summary: {
      averageRating: 4.3,
      totalReviews: 156,
      ratingDistribution: {
        5: 68,
        4: 45,
        3: 28,
        2: 10,
        1: 5
      }
    },
    reviews: [
      {
        id: 1,
        customerName: 'Sarah Johnson',
        rating: 5,
        date: '2 days ago',
        orderNumber: '#ORD001',
        comment: 'Amazing pizza! The crust was perfect and delivery was super fast. Will definitely order again!',
        foodRating: 5,
        deliveryRating: 5,
        hasReply: false,
        helpful: 12
      },
      {
        id: 2,
        customerName: 'Mike Chen',
        rating: 4,
        date: '3 days ago',
        orderNumber: '#ORD002',
        comment: 'Good food overall. The pasta was delicious but took a bit longer than expected to arrive.',
        foodRating: 5,
        deliveryRating: 3,
        hasReply: true,
        reply: 'Thank you for your feedback Mike! We\'re working on improving our delivery times.',
        helpful: 8
      },
      {
        id: 3,
        customerName: 'Emma Wilson',
        rating: 5,
        date: '5 days ago',
        orderNumber: '#ORD003',
        comment: 'Best Italian food in the area! The tiramisu was heavenly. Great portion sizes too.',
        foodRating: 5,
        deliveryRating: 4,
        hasReply: false,
        helpful: 15
      },
      {
        id: 4,
        customerName: 'John Davis',
        rating: 2,
        date: '1 week ago',
        orderNumber: '#ORD004',
        comment: 'Food was cold when it arrived and the order was missing items. Very disappointed.',
        foodRating: 2,
        deliveryRating: 1,
        hasReply: true,
        reply: 'We sincerely apologize for this experience John. We\'ve issued a full refund and are addressing this with our kitchen team.',
        helpful: 3
      },
      {
        id: 5,
        customerName: 'Lisa Rodriguez',
        rating: 4,
        date: '1 week ago',
        orderNumber: '#ORD005',
        comment: 'Solid choice for Italian food. The garlic bread was amazing! Just wish there were more vegetarian options.',
        foodRating: 4,
        deliveryRating: 4,
        hasReply: false,
        helpful: 6
      }
    ]
  };

  const filters = [
    { key: 'all', label: 'All Reviews' },
    { key: '5', label: '5 Stars' },
    { key: '4', label: '4 Stars' },
    { key: '3', label: '3 Stars' },
    { key: '2', label: '2 Stars' },
    { key: '1', label: '1 Star' },
    { key: 'no-reply', label: 'No Reply' }
  ];

  const filteredReviews = reviewsData.reviews.filter(review => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'no-reply') return !review.hasReply;
    return review.rating.toString() === selectedFilter;
  });

  const handleReply = (reviewId) => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply message');
      return;
    }

    // Simulate API call to save reply
    Alert.alert('Success', 'Reply posted successfully!');
    setReplyText('');
    setShowReplyFor(null);
  };

  const RatingStars = ({ rating, size = 16 }) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? '#FFD700' : '#ccc'}
        />
      ))}
    </View>
  );

  const RatingBar = ({ rating, count, total }) => {
    const percentage = (count / total) * 100;
    return (
      <View style={styles.ratingBar}>
        <Text style={styles.ratingNumber}>{rating}</Text>
        <Ionicons name="star" size={16} color="#FFD700" />
        <View style={styles.barContainer}>
          <View style={[styles.bar, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingCount}>{count}</Text>
      </View>
    );
  };

  const ReviewCard = ({ review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{review.customerName}</Text>
          <View style={styles.reviewMeta}>
            <RatingStars rating={review.rating} />
            <Text style={styles.reviewDate}>{review.date}</Text>
            <Text style={styles.orderNumber}>{review.orderNumber}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.helpfulButton}>
          <Ionicons name="thumbs-up-outline" size={16} color="#666" />
          <Text style={styles.helpfulText}>{review.helpful}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.reviewComment}>{review.comment}</Text>

      <View style={styles.detailedRatings}>
        <View style={styles.detailedRating}>
          <Text style={styles.detailedRatingLabel}>Food</Text>
          <RatingStars rating={review.foodRating} size={14} />
        </View>
        <View style={styles.detailedRating}>
          <Text style={styles.detailedRatingLabel}>Delivery</Text>
          <RatingStars rating={review.deliveryRating} size={14} />
        </View>
      </View>

      {review.hasReply && (
        <View style={styles.replyContainer}>
          <View style={styles.replyHeader}>
            <Ionicons name="chatbubble-outline" size={16} color="#FF6B35" />
            <Text style={styles.replyLabel}>Your Reply</Text>
          </View>
          <Text style={styles.replyText}>{review.reply}</Text>
        </View>
      )}

      {!review.hasReply && (
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => setShowReplyFor(review.id)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#FF6B35" />
          <Text style={styles.replyButtonText}>Reply to Review</Text>
        </TouchableOpacity>
      )}

      {showReplyFor === review.id && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write a professional reply..."
            value={replyText}
            onChangeText={setReplyText}
            multiline={true}
            numberOfLines={3}
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowReplyFor(null);
                setReplyText('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.postButton}
              onPress={() => handleReply(review.id)}
            >
              <Text style={styles.postButtonText}>Post Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Rating Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating Overview</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.averageRating}>
              <Text style={styles.averageRatingNumber}>
                {reviewsData.summary.averageRating}
              </Text>
              <RatingStars rating={Math.round(reviewsData.summary.averageRating)} size={20} />
              <Text style={styles.totalReviews}>
                {reviewsData.summary.totalReviews} reviews
              </Text>
            </View>
            
            <View style={styles.ratingDistribution}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={reviewsData.summary.ratingDistribution[rating]}
                  total={reviewsData.summary.totalReviews}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.key && styles.filterTabActive
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === filter.key && styles.filterTabTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reviews List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Customer Reviews ({filteredReviews.length})
          </Text>
          
          {filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          
          {filteredReviews.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No reviews found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filter or check back later
              </Text>
            </View>
          )}
        </View>

        {/* Tips for Responding */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Responding to Reviews</Text>
          
          <View style={styles.tipCard}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Respond promptly to show you care about customer feedback
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="heart" size={20} color="#E91E63" />
            <Text style={styles.tipText}>
              Thank customers for positive reviews and address concerns professionally
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#FF9800" />
            <Text style={styles.tipText}>
              Use negative feedback as an opportunity to improve your service
            </Text>
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
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageRating: {
    alignItems: 'center',
    marginRight: 30,
  },
  averageRatingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  totalReviews: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  ratingDistribution: {
    flex: 1,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 14,
    color: '#333',
    width: 12,
    textAlign: 'right',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
    width: 20,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterTabActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  orderNumber: {
    fontSize: 12,
    color: '#FF6B35',
    marginLeft: 10,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  helpfulText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 15,
  },
  detailedRatings: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  detailedRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailedRatingLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  replyContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 5,
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  replyButtonText: {
    fontSize: 14,
    color: '#FF6B35',
    marginLeft: 5,
    fontWeight: '500',
  },
  replyInputContainer: {
    marginTop: 10,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
  },
  postButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  postButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginTop: 15,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
