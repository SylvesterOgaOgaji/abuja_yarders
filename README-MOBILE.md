# Mobile App Setup Guide

This guide will help you set up and deploy the Sale4Me mobile app for iOS and Android using Capacitor.

## Prerequisites

- Node.js (latest version)
- Git
- For iOS: Mac with Xcode (latest version)
- For Android: Android Studio

## Initial Setup

1. **Clone your repository**
   ```bash
   git clone <your-repo-url>
   cd sale4me-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize Capacitor platforms**
   
   Add iOS platform:
   ```bash
   npx cap add ios
   ```
   
   Add Android platform:
   ```bash
   npx cap add android
   ```

4. **Update native dependencies**
   ```bash
   npx cap update ios
   npx cap update android
   ```

## Development Workflow

### Hot Reload Development

The `capacitor.config.ts` is configured to use hot reload from the Lovable sandbox during development:

```typescript
server: {
  url: 'https://3c0d723d-e7f6-49d9-a604-d3cc650ec10a.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

This allows you to:
- Make changes in Lovable
- See updates immediately on your mobile device/emulator
- No need to rebuild the native app for UI changes

### Building for Production

1. **Build the web assets**
   ```bash
   npm run build
   ```

2. **Sync with native platforms**
   ```bash
   npx cap sync
   ```

3. **Run on iOS**
   ```bash
   npx cap run ios
   ```

4. **Run on Android**
   ```bash
   npx cap run android
   ```

## In-App Purchases with RevenueCat

### Setup RevenueCat

1. Create a free account at [RevenueCat](https://www.revenuecat.com/)
2. Create a new project
3. Add your iOS and Android apps
4. Configure products in App Store Connect and Google Play Console
5. Link products in RevenueCat dashboard

### Configure API Keys

Add the RevenueCat API key to your `.env` file:

```bash
VITE_REVENUECAT_API_KEY=your_api_key_here
```

### Testing Purchases

Use RevenueCat's sandbox mode for testing:
- iOS: Use sandbox test accounts from App Store Connect
- Android: Use test accounts from Google Play Console

## Codemagic CI/CD Setup

### Prerequisites

1. Sign up at [Codemagic](https://codemagic.io/)
2. Connect your repository
3. Configure the following:

#### For iOS:
- App Store Connect API key
- Code signing certificates and provisioning profiles
- Set environment variable: `APP_STORE_APPLE_ID`

#### For Android:
- Upload your keystore file
- Configure keystore credentials
- Set up Google Play service account

### Environment Variables

Set these in Codemagic:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_REVENUECAT_API_KEY`
- `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (for Android)

### Build Triggers

The `codemagic.yaml` file includes two workflows:
- `ios-release`: Builds and submits to TestFlight
- `android-release`: Builds and uploads to Google Play internal track

## App Store Submission

### iOS (App Store Connect)

1. Create app in App Store Connect
2. Configure app metadata
3. Set up in-app purchases
4. Submit for review through Codemagic or manually

### Android (Google Play Console)

1. Create app in Google Play Console
2. Configure store listing
3. Set up in-app products
4. Upload build via Codemagic or manually

## Troubleshooting

### iOS Build Issues
- Ensure Xcode is up to date
- Check provisioning profiles are valid
- Verify bundle identifier matches: `app.lovable.3c0d723de7f649d9a604d3cc650ec10a`

### Android Build Issues
- Ensure Android SDK is properly installed
- Check Gradle version compatibility
- Verify package name matches: `app.lovable.3c0d723de7f649d9a604d3cc650ec10a`

### RevenueCat Issues
- Verify API key is correct
- Check product IDs match between stores and RevenueCat
- Ensure app is in sandbox mode for testing

## Production Deployment

Before deploying to production:

1. **Update server URL in capacitor.config.ts**
   ```typescript
   server: {
     // Remove or comment out the development URL
     // url: 'https://...',
   }
   ```

2. **Build and sync**
   ```bash
   npm run build
   npx cap sync
   ```

3. **Deploy via Codemagic** or manually through Xcode/Android Studio

## Support

For issues or questions:
- Capacitor docs: https://capacitorjs.com/
- RevenueCat docs: https://docs.revenuecat.com/
- Codemagic docs: https://docs.codemagic.io/

## Admin Access

The admin user (slyokoh@gmail.com) has been granted full admin privileges with access to:
- User management
- Group management
- Seller request approvals
- All administrative features
