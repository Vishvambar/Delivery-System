# Data Sync Test Guide

## How to Test Real-Time Data Synchronization

### Prerequisites
1. Start the backend server: `cd server && npm run dev`
2. Open vendor app: `cd apps/vendor && npm start`
3. Open customer app: `cd apps/customer && npm start`
4. Login to both apps (vendor@test.com / customer@test.com)

### Test Scenarios

#### 1. Adding New Menu Item
**In Vendor App:**
1. Navigate to Menu screen
2. Tap "+" to add new item
3. Fill in details: Name, Price, Description, Category
4. Save the item

**Expected Results:**
- ✅ Item appears in vendor app menu list
- ✅ Console shows: "📱 Syncing created menu item to shared storage"
- ✅ Item appears in customer app within 1-3 seconds
- ✅ Customer app console shows: "📱 Received updated menu from vendor app"

#### 2. Editing Menu Item
**In Vendor App:**
1. Tap on any menu item
2. Edit the name or price
3. Save changes

**Expected Results:**
- ✅ Changes appear in vendor app
- ✅ Console shows: "📱 Syncing updated menu item to shared storage"
- ✅ Changes appear in customer app within 1-3 seconds

#### 3. Toggling Item Availability
**In Vendor App:**
1. Go to Menu screen
2. Tap the toggle switch next to any item

**Expected Results:**
- ✅ Item shows as unavailable (grayed out) in vendor app
- ✅ Console shows: "📱 Syncing availability toggle to shared storage"
- ✅ Item becomes unavailable in customer app within 1-3 seconds

#### 4. Deleting Menu Item
**In Vendor App:**
1. Tap on any menu item
2. Tap Delete button
3. Confirm deletion

**Expected Results:**
- ✅ Item disappears from vendor app
- ✅ Console shows: "📱 Syncing deleted menu item to shared storage"
- ✅ Item disappears from customer app within 1-3 seconds

#### 5. API Fallback Test
**Test Steps:**
1. Turn off server/internet
2. Open customer app
3. Navigate to vendor details

**Expected Results:**
- ✅ Customer app shows cached menu from shared storage
- ✅ Console shows: "📱 Using shared menu data from vendor app"

### Troubleshooting

#### Common Issues:
1. **No sync happening**: Check console logs for sync messages
2. **API errors**: Ensure server is running and vendor ID is correct
3. **Slow updates**: Reduce polling interval in dataSync service
4. **Menu not showing**: Check if vendor ID matches between apps

#### Console Messages to Look For:
- Vendor App: "📱 Syncing [action] to shared storage"
- Customer App: "📱 Received updated menu from vendor app"
- API Success: "📥 API Response: 200"
- API Fallback: "📱 Using shared menu data from vendor app"

### Performance Notes
- Sync polling: 2 seconds (vendor app) / 1.5 seconds (customer app)
- Data stored in AsyncStorage with unique timestamps
- Only syncs when actual changes are detected
- Graceful fallback to cached data when API fails
