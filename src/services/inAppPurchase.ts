import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

export const initializeRevenueCat = async () => {
  try {
    // Configure RevenueCat with your API keys
    // iOS: Get from App Store Connect
    // Android: Get from Google Play Console
    await Purchases.configure({
      apiKey: import.meta.env.VITE_REVENUECAT_API_KEY || 'your_revenuecat_api_key_here',
      appUserID: undefined, // Will be set when user logs in
    });
    
    // Enable debug logs in development
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
};

export const setUserIdentifier = async (userId: string) => {
  try {
    await Purchases.logIn({ appUserID: userId });
  } catch (error) {
    console.error('Failed to set user identifier:', error);
  }
};

export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

export const purchasePackage = async (packageToPurchase: any) => {
  try {
    const purchaseResult = await Purchases.purchasePackage({
      aPackage: packageToPurchase,
    });
    
    return {
      success: true,
      customerInfo: purchaseResult.customerInfo,
    };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }
    console.error('Purchase failed:', error);
    return { success: false, error };
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
};

export const checkSubscriptionStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const hasActiveSubscription = Object.keys(customerInfo.customerInfo.entitlements.active).length > 0;
    
    return {
      isSubscribed: hasActiveSubscription,
      entitlements: customerInfo.customerInfo.entitlements.active,
    };
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return { isSubscribed: false, entitlements: {} };
  }
};
