# Time.fun Web App Setup

## Environment Variables

Create a `.env.local` file in the `apps/web` directory with the following variables:

```env
# Twitter OAuth Configuration
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_twitter_client_id_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Features Implemented

### ✅ Wallet Connection
- Integrated Solana wallet adapter with proper hooks
- Support for Phantom wallet and other Solana wallets
- Real-time wallet connection status
- Wallet address display and copy functionality

### ✅ Twitter OAuth Login
- Complete Twitter OAuth 2.0 flow implementation
- PKCE (Proof Key for Code Exchange) security
- Error handling and user feedback
- Session management with localStorage

### ✅ Profile Page
- Comprehensive user profile management
- Editable user information (name, email, bio, profession, etc.)
- Skills management system
- Professional information (hourly rate, experience, availability)
- Wallet integration display
- Statistics tracking (sessions, earnings, ratings)

### ✅ Integrated Login Modal
- Unified login experience for both wallet and Twitter
- Step-by-step connection flow
- Visual feedback and status indicators
- Seamless integration between authentication methods

## How to Use

1. **Connect Wallet**: Click the "Login" button and select "Connect Wallet" to connect your Solana wallet
2. **Twitter Login**: Click the "Login" button and select "Login with Twitter" to authenticate with Twitter
3. **Profile Management**: Once logged in, click on your profile in the navbar to access the profile page
4. **Edit Profile**: Use the "Edit Profile" button to update your information, skills, and professional details

## Backend Requirements

Make sure your backend server is running on `http://localhost:5000` with the following endpoints:
- `POST /auth/twitter/callback` - Twitter OAuth callback handler

## Dependencies

The app uses:
- Next.js 15 with React 19
- Solana wallet adapter for Web3 integration
- Framer Motion for animations
- Tailwind CSS for styling
- Axios for API calls
- Lucide React for icons

## Troubleshooting

### Wallet Connection Issues
- Ensure you have a Solana wallet extension installed (Phantom recommended)
- Check that you're on the correct network (Devnet by default)
- Try refreshing the page if connection fails

### Twitter Login Issues
- Verify that `NEXT_PUBLIC_TWITTER_CLIENT_ID` is set correctly
- Ensure the backend server is running
- Check browser console for error messages

### Profile Page Issues
- Make sure you're logged in with either wallet or Twitter
- Check that the AuthContext is properly wrapping your app
