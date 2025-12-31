# Abuja Yarder Meeting Point
 
Abuja Yarder Meeting Point is a robust, full-featured marketplace and community engagement platform designed to foster connection, facilitate commerce, and streamline administration for the Abuja Yarders community. Built with modern web technologies, it bridges the gap between a vibrant community and a functional marketplace.

## Project Overview

This application serves two primary purposes:
1.  **Community Hub**: A space for users to interact via chat groups, receive announcements, and stay updated with leadership ("Exco") activities.
2.  **Marketplace**: A platform for verified sellers to list services and products, and for users to initiate offers and bids.

## Keys Features

### 🔐 Authentication & Security
-   **Supabase Auth**: Secure email/password and social login.
-   **Role-Based Access Control (RLS)**: Strict data policies ensuring users only access what they are permitted to.
-   **Link Safety**: Automated warnings and attestation dialogs for external links shared in chats to prevent scams.

### 💬 Communication & Community
-   **Real-time Chat Groups**: Dynamic messaging with support for media uploads.
-   **Moderation Tools**: Admins can pin messages, delete inappropriate content, and ban users.
-   **Group Management**: Admins have visibility into all groups with "blur/lock" logic for non-members.

### 🛍️ Marketplace & Sellers
-   **Seller Verification**: Workflow for users to request seller status, now streamlined (removed NIN requirement).
-   **Product/Service Listings**: Verified sellers can post listings.
-   **Bids & Offers**: Interactive system for negotiating prices.

### 📊 Admin Dashboard & CMS
-   **Dynamic Content Management**: Admins can update dashboard banners, announcements, and images directly from the UI.
-   **"Meet the Exco"**: Manage leadership profiles and displays.
-   **Commitment Analysis**: specialized module to track:
    -   **Financial Pledges**: Track amounts pledged vs. paid with fulfillment rates.
    -   **Volunteering**: Manage lists of volunteers for events/operations.
    -   **Planning Capacity**: Track programme planners.
    -   Public/Private toggle for commitment leaderboards.
-   **User Management**: Complete control over user roles and bans.

### 📱 Mobile Experience
-   **Capacitor Integration**: Native app capabilities.
-   **Camera Access**: Integrated `useCamera` hook for media uploads.
-   **Push Notifications**: System-wide alerts for important updates.
-   **Offline Persistence**: Caching layer to ensure core data remains available without internet.

## Tech Stack

-   **Frontend**: React (Vite), TypeScript
-   **UI/UX**: Tailwind CSS, Shadcn UI, Lucide React
-   **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
-   **Mobile**: Capacitor (iOS/Android)
-   **State Management**: TanStack Query (React Query)

## Getting Started

### Prerequisites
-   Node.js & npm
-   Supabase Project (for backend connection)

### Installation

1.  **Clone the repository**
    ```sh
    git clone <YOUR_GIT_URL>
    cd sale4me-connect
    ```

2.  **Install dependencies**
    ```sh
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup**
    Create a `.env` file and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**
    ```sh
    npm run dev
    ```

## Development & Deployment

-   **Migrations**: Database changes are managed via Supabase migrations (`/supabase/migrations`).
-   **Deployment**: Connect the repo to your preferred hosting provider (Vercel, Netlify) or use the Lovable platform for instant deployment.

## Future Roadmap

The detailed roadmap includes:
-   [ ] **Advanced Analytics**: Deeper insights into user engagement and marketplace transactions.
-   [ ] **Enhanced Offline Support**: More robust syncing mechanisms for offline actions.
-   [ ] **Payment Gateway Integration**: Direct processing for pledges and marketplace payments.
-   [ ] **Expanded Marketplace Features**: Auctions, enhanced categorization, and rating systems.
-   [ ] **Refined Notification System**: Granular control over notification types and channels.

---

**Built by Sylvester Oga Ogaji**  
Donated to the **Abuja Yarders of the Intentional Parent Academy**  
*This is a free donation managed by the community.*
