import AsyncStorage from '@react-native-async-storage/async-storage';

const DATA_SYNC_KEY = '@shared_vendor_data';
const MAX_STORAGE_SIZE = 150000; // 150KB limit to prevent overflow
const MAX_VENDORS = 10; // Maximum number of vendors to keep in storage

class DataSyncService {
  // Check storage size and clean if needed
  async cleanupStorageIfNeeded(newData) {
    const dataString = JSON.stringify(newData);
    if (dataString.length > MAX_STORAGE_SIZE) {
      console.log('📱 Storage size exceeded, cleaning up old data...');
      
      // Keep only the most recent vendors
      const vendors = Object.entries(newData);
      vendors.sort((a, b) => new Date(b[1].lastUpdated) - new Date(a[1].lastUpdated));
      
      const cleanedData = {};
      vendors.slice(0, MAX_VENDORS).forEach(([vendorId, data]) => {
        // Remove large properties if they exist
        const cleanVendorData = {
          ...data,
          menu: data.menu ? data.menu.slice(0, 20) : [] // Keep only first 20 menu items
        };
        cleanedData[vendorId] = cleanVendorData;
      });
      
      return cleanedData;
    }
    return newData;
  }

  // Save vendor data to shared storage
  async saveVendorData(vendorId, data) {
    try {
      const existingData = await this.getAllVendorData();
      const newVendorData = {
        ...existingData[vendorId],
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      // Only keep essential data to prevent storage overflow
      const essentialData = {
        businessName: newVendorData.businessName,
        category: newVendorData.category,
        isOpen: newVendorData.isOpen,
        lastUpdated: newVendorData.lastUpdated
      };
      
      existingData[vendorId] = essentialData;
      
      // Clean up storage if it's getting too large
      const cleanedData = await this.cleanupStorageIfNeeded(existingData);
      
      await AsyncStorage.setItem(DATA_SYNC_KEY, JSON.stringify(cleanedData));
      console.log('📱 Vendor data saved to shared storage:', vendorId);
    } catch (error) {
      console.error('❌ Failed to save vendor data:', error);
      // If saving fails due to storage limit, clear all data and retry with just this vendor
      if (error.message && error.message.includes('storage')) {
        await this.clearAllData();
        try {
          await AsyncStorage.setItem(DATA_SYNC_KEY, JSON.stringify({
            [vendorId]: {
              businessName: data.businessName,
              lastUpdated: new Date().toISOString()
            }
          }));
        } catch (retryError) {
          console.error('❌ Failed to save even after clearing:', retryError);
        }
      }
    }
  }

  // Get all vendor data from shared storage
  async getAllVendorData() {
    try {
      const data = await AsyncStorage.getItem(DATA_SYNC_KEY);
      if (!data) return {};
      
      const parsedData = JSON.parse(data);
      
      // Validate that the data isn't corrupted or too large
      const dataString = JSON.stringify(parsedData);
      if (dataString.length > MAX_STORAGE_SIZE) {
        console.log('📱 Storage data too large, clearing...');
        await this.clearAllData();
        return {};
      }
      
      return parsedData;
    } catch (error) {
      console.error('❌ Failed to get vendor data, clearing corrupted data:', error);
      // Clear corrupted data
      await this.clearAllData();
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

  // Save menu items for a vendor (limit size to prevent overflow)
  async saveMenuItems(vendorId, menuItems) {
    try {
      // Only save essential menu item data to prevent storage overflow
      const limitedMenuItems = menuItems.slice(0, 10).map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        isAvailable: item.isAvailable
      }));
      
      const vendorData = await this.getVendorData(vendorId) || {};
      await this.saveVendorData(vendorId, {
        ...vendorData,
        menu: limitedMenuItems
      });
      console.log('📱 Limited menu items saved for vendor:', vendorId, `(${limitedMenuItems.length} items)`);
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

// Clear corrupted data on app start (run this once to fix the current issue)
dataSyncService.clearAllData().then(() => {
  console.log('🧹 Cleared potentially corrupted vendor data on app start');
}).catch(err => {
  console.error('❌ Failed to clear data:', err);
});
