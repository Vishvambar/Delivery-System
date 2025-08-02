import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

class PermissionsService {
  constructor() {
    this.permissionStatus = {
      camera: null,
      mediaLibrary: null
    };
  }

  // Check if all permissions are granted
  async checkAllPermissions() {
    try {
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      const mediaLibraryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();

      this.permissionStatus = {
        camera: cameraStatus.status,
        mediaLibrary: mediaLibraryStatus.status
      };

      console.log('📋 Permission Status:', this.permissionStatus);
      return this.permissionStatus;
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return null;
    }
  }

  // Request camera permission
  async requestCameraPermission() {
    try {
      console.log('📸 Requesting camera permission...');
      
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      
      this.permissionStatus.camera = status;
      console.log('📸 Camera permission status:', status);

      if (status === 'granted') {
        return { success: true, status };
      }

      if (status === 'denied' && !canAskAgain) {
        // Permission permanently denied
        this.showPermissionDeniedAlert('camera');
        return { success: false, status, reason: 'permanently_denied' };
      }

      if (status === 'denied') {
        // Permission denied but can ask again
        return { success: false, status, reason: 'denied' };
      }

      return { success: false, status, reason: 'unknown' };
    } catch (error) {
      console.error('❌ Camera permission error:', error);
      return { success: false, error: error.message };
    }
  }

  // Request media library permission
  async requestMediaLibraryPermission() {
    try {
      console.log('📷 Requesting media library permission...');
      
      // For newer Android versions (API 33+), use partial access
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
      
      this.permissionStatus.mediaLibrary = status;
      console.log('📷 Media library permission status:', status);

      if (status === 'granted') {
        return { success: true, status };
      }

      if (status === 'denied' && !canAskAgain) {
        // Permission permanently denied
        this.showPermissionDeniedAlert('media_library');
        return { success: false, status, reason: 'permanently_denied' };
      }

      if (status === 'denied') {
        // Permission denied but can ask again
        return { success: false, status, reason: 'denied' };
      }

      return { success: false, status, reason: 'unknown' };
    } catch (error) {
      console.error('❌ Media library permission error:', error);
      return { success: false, error: error.message };
    }
  }

  // Show permission denied alert with option to go to settings
  showPermissionDeniedAlert(permissionType) {
    const permissionName = permissionType === 'camera' ? 'Camera' : 'Photo Library';
    const message = `${permissionName} permission is required to add photos to your menu items. Please enable it in your device settings.`;

    Alert.alert(
      `${permissionName} Permission Required`,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        }
      ]
    );
  }

  // Check if camera permission is granted
  isCameraPermissionGranted() {
    return this.permissionStatus.camera === 'granted';
  }

  // Check if media library permission is granted
  isMediaLibraryPermissionGranted() {
    return this.permissionStatus.mediaLibrary === 'granted';
  }

  // Request permission with user-friendly error handling
  async requestPermissionWithFallback(permissionType) {
    const isCamera = permissionType === 'camera';
    const permissionName = isCamera ? 'Camera' : 'Photo Library';

    try {
      // First check current status
      await this.checkAllPermissions();

      // Check if already granted
      const currentStatus = isCamera ? this.permissionStatus.camera : this.permissionStatus.mediaLibrary;
      if (currentStatus === 'granted') {
        console.log(`✅ ${permissionName} permission already granted`);
        return { success: true, status: 'granted' };
      }

      // Request permission
      const result = isCamera 
        ? await this.requestCameraPermission()
        : await this.requestMediaLibraryPermission();

      if (result.success) {
        console.log(`✅ ${permissionName} permission granted`);
        return result;
      }

      // Handle different failure scenarios
      if (result.reason === 'permanently_denied') {
        console.log(`❌ ${permissionName} permission permanently denied`);
        return result;
      }

      if (result.reason === 'denied') {
        Alert.alert(
          `${permissionName} Permission Required`,
          `Please allow ${permissionName.toLowerCase()} access to add photos to your menu items.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Try Again', 
              onPress: () => this.requestPermissionWithFallback(permissionType)
            }
          ]
        );
        return result;
      }

      // Unknown error
      Alert.alert(
        'Permission Error',
        `Unable to request ${permissionName.toLowerCase()} permission. Please try again.`
      );
      return result;

    } catch (error) {
      console.error(`❌ ${permissionName} permission request failed:`, error);
      Alert.alert(
        'Permission Error',
        `An error occurred while requesting ${permissionName.toLowerCase()} permission: ${error.message}`
      );
      return { success: false, error: error.message };
    }
  }

  // Comprehensive permission check for image picker
  async prepareImagePicker() {
    console.log('🔍 Preparing image picker permissions...');
    
    try {
      // Check current permissions
      await this.checkAllPermissions();

      const results = {
        camera: { available: false, reason: null },
        mediaLibrary: { available: false, reason: null }
      };

      // Check camera permission
      if (this.permissionStatus.camera === 'granted') {
        results.camera.available = true;
      } else {
        console.log('📸 Camera permission not granted, will request when needed');
        results.camera.reason = 'not_granted';
      }

      // Check media library permission
      if (this.permissionStatus.mediaLibrary === 'granted') {
        results.mediaLibrary.available = true;
      } else {
        console.log('📷 Media library permission not granted, will request when needed');
        results.mediaLibrary.reason = 'not_granted';
      }

      console.log('🔍 Image picker preparation complete:', results);
      return results;

    } catch (error) {
      console.error('❌ Image picker preparation failed:', error);
      Alert.alert(
        'Preparation Error',
        'Unable to prepare image picker. Please restart the app and try again.'
      );
      return null;
    }
  }
}

export const permissionsService = new PermissionsService();
