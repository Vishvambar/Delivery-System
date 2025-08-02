import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.detailsText}>Name: John Doe</Text>
      <Text style={styles.detailsText}>Phone: (555) 555-5555</Text>
      {/* Add more profile information here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailsText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default ProfileScreen;