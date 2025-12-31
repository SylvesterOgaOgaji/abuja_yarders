# Hybrid Mobile Deployment Guide

This project is configured as a Hybrid Mobile App using **Capacitor**. It combines the flexibility of a PWA (Progressive Web App) with native device capabilities.

## 1. Architecture Overview
- **Core Technology:** React + Vite + TypeScript
- **Mobile Runtime:** Capacitor (Android & iOS)
- **Offline Strategy:** Service Workers (via `vite-plugin-pwa`) + LocalStorage/IndexedDB (via `tanstack-query`)
- **Privacy:** Compliant with GDPR/CCPA (see `PRIVACY_POLICY.md`)

## 2. Configuration (`capacitor.config.ts`)
The app is configured to load the **Live Version** from your production URL. This means you can update the app instantly by deploying to your web server, without re-submitting to App Stores.

**Current Settings:**
- `webDir`: 'dist' (Used for bundling assets)
- `server.url`: Points to your hosted web app. **IMPORTANT:** Update this to your production domain (e.g., `https://app.parentacademy.com`) before release.

### Offline Support Note
To ensure the app works offline:
1. The user must open the app *once* while online.
2. The **Service Worker** (configured in `vite.config.ts`) will cache the necessary assets.
3. Subsequent opens while offline will be served by the Service Worker.

## 3. Native Plugins
We utilize the following native capabilities:
- **Storage:** `localStorage` (Web standard, works offline) & `@capacitor/preferences` (Secure storage).
- **Camera/Photos:** For profile verification.
- **Push Notifications:** For real-time alerts.

## 4. Development & Build Steps

### Prerequisites
- Node.js & npm
- Android Studio (for Android)
- Xcode (for iOS)

### Step 1: Build the Web App
```bash
npm run build
```

### Step 2: Sync with Capacitor
```bash
npx cap sync
```

### Step 2.5: Generate App Icons & Splash Screens
To generate professional app icons and splash screens for both Android and iOS:

1.  **Install the Assets Tool:**
    ```bash
    npm install @capacitor/assets --save-dev
    ```
2.  **Prepare Source Images:**
    *   Create a folder named `assets` in the root directory.
    *   Place your logo as `icon.png` (Recommended 1024x1024).
    *   Place your splash screen set as `splash.png` (Recommended 2732x2732) or `splash-dark.png` for dark mode.
3.  **Generate Assets:**
    ```bash
    npx capacitor-assets generate
    ```
    This will automatically resize and place the icons in the correct Android and iOS folders.

### Step 3: Open in Native IDE
**Android:**
```bash
npx cap open android
```

**iOS:**
```bash
npx cap open ios
```

## 5. Troubleshooting
- **Version Mismatch:** You might see warnings about `@capacitor/core` version. Ensure all `@capacitor/*` dependencies are aligned in `package.json`.
- **Offline Not Working:** Verify that `vite-plugin-pwa` is active and that your production server supports HTTPS (Service Workers require HTTPS).
