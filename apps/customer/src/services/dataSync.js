import AsyncStorage from '@react-native-async-storage/async-storage';

const DATA_SYNC_KEY = '@shared_vendor_data';

class DataSyncService {
  // Save vendor data to shared storage
  async saveVendorData(vendorId, data) {
    try {
      const existingData = await this.getAllVendorData();
      existingData[vendorId] = {
        ...existingData[vendorId],
        ...data,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(DATA_SYNC_KEY, JSON.stringify(existingData));
      console.log('📱 Vendor data saved to shared storage:', vendorId);
    } catch (error) {
      console.error('❌ Failed to save vendor data:', error);
    }
  }

  // Get all vendor data from shared storage
  async getAllVendorData() {
    try {
      const data = await AsyncStorage.getItem(DATA_SYNC_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Failed to get vendor data:', error);
      return {};
    }
  }

  // Get specific vendor data
  async getVendorData(vendorId) {
    try {
      const allData = await this.getAllVendorData();
      return allData[vendorId] || null;
    } catch (error) {
      console.error('❌ Failed to get vendor data:', error);
      return null;
    }
  }

  // Save menu items for a vendor
  async saveMenuItems(vendorId, menuItems) {
    try {
      const vendorData = await this.getVendorData(vendorId) || {};
      await this.saveVendorData(vendorId, {
        ...vendorData,
        menu: menuItems
      });
      console.log('📱 Menu items saved for vendor:', vendorId);
    } catch (error) {
      console.error('❌ Failed to save menu items:', error);
    }
  }

  // Get menu items for a vendor
  async getMenuItems(vendorId) {
    try {
      const vendorData = await this.getVendorData(vendorId);
      return vendorData?.menu || [];
    } catch (error) {
      console.error('❌ Failed to get menu items:', error);
      return [];
    }
  }

  // Clear all shared data
  async clearAllData() {
    try {
      await AsyncStorage.removeItem(DATA_SYNC_KEY);
      console.log('📱 All shared vendor data cleared');
    } catch (error) {
      console.error('❌ Failed to clear vendor data:', error);
    }
  }

  // Listen for data changes (faster polling for better real-time sync)
  startDataSync(callback, interval = 2000) {
    let lastUpdateTime = null;
    
    return setInterval(async () => {
      try {
        const allData = await this.getAllVendorData();
        
        // Check if data has actually changed by comparing lastUpdated timestamps
        const currentUpdateTimes = Object.values(allData).map(vendor => vendor.lastUpdated);
        const latestUpdate = currentUpdateTimes.length > 0 ? Math.max(...currentUpdateTimes.map(t => new Date(t).getTime())) : 0;
        
        if (lastUpdateTime !== latestUpdate) {
          lastUpdateTime = latestUpdate;
          if (callback) {
            callback(allData);
          }
        }
      } catch (error) {
        console.error('❌ Data sync error:', error);
      }
    }, interval); // Default 2 seconds for faster updates
  }

  // Stop listening for data changes
  stopDataSync(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}

export const dataSyncService = new DataSyncService();
