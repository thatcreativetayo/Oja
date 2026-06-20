# Oja Auth Flow Documentation

## Overview

The auth system uses OTP-based phone authentication integrated with the backend API. All styling matches your existing design system.

## Auth Flow

### For Existing Users (Login)

**Path**: Splash → Login

1. **Role Selection** (`step='role'`)
   - User selects: Buyer 🛒, Vendor 🏪, or Rider 🏍️
   - Click to proceed to phone entry

2. **Phone Entry** (`step='phone'`)
   - Title: "Login as {role}"
   - Input format: NG +234 [10 digits]
   - "Send OTP" button (disabled until 10 digits entered)
   - "Change role" link to go back

3. **OTP Verification** (`step='otp'`)
   - Shows sent phone number
   - 6-digit OTP entry with number keypad
   - Dev mode: OTP shown in alert
   - "Verify & Login" button
   - "Change phone number" link

4. **Auto Navigation**
   - After successful verification, RootNavigator automatically switches to role-specific tabs
   - No manual navigation needed

### For New Users (Sign Up)

**Path**: Splash → Login → RoleSelection → VerifyPhone

1. **Role Selection Screen**
   - Choose role with detailed descriptions
   - "Already have an account? Login" link

2. **Phone Verification**
   - Same 2-step process (phone entry → OTP)
   - Uses real backend OTP system

3. **Auto Login**
   - After OTP verification, user is automatically logged in
   - Buyers go straight to home screen
   - Vendors/Riders can complete profile later

## Styling

All screens use your design system:
- `Screen`, `Card`, `Input`, `Button` primitives
- `colors`, `fonts`, `spacing`, `radius` from theme
- Consistent icon circles, role cards, keypads
- Error cards with red styling

## Test Credentials

### Quick Test (Buyer)
- Phone: `8122200011` (add NG +234 prefix automatically)
- Role: Buyer
- OTP: Check backend console or dev mode alert

### More Test Users
See `TEST_CREDENTIALS.md` for full list of seeded users.

## Development Mode Features

When `__DEV__` is true:
- OTP is shown in alert after "Send OTP"
- OTP is displayed on the verification screen
- Backend logs OTP to console
- API timeout set to 10 seconds

## Backend Integration

### Endpoints Used
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and get token
- `GET /api/auth/me` - Validate session on app start

### Token Storage
- Token stored in AsyncStorage as `oja_token`
- User data stored as `oja_user`
- Auto-injected in all API requests via Bearer header

### Session Persistence
- On app launch, `loadSession()` validates token with backend
- If valid: user stays logged in
- If invalid: token cleared, user sees login

## Navigation Flow

```
Splash (900ms)
  ↓
  ├─ If authenticated → RootNavigator shows role tabs
  └─ If not authenticated → Login Screen
       ↓
       Login (role → phone → otp → auto login)
       OR
       "New to Oja?" → RoleSelection → VerifyPhone → auto login
```

## Error Handling

- Network errors: "Network request failed..."
- Timeout (10s): "Request timed out..."
- Invalid OTP: "Invalid or expired OTP"
- All errors shown in red error cards
- Errors auto-clear when user retries

## API Timeout Issue Fix

If seeing "Request timed out":
1. Check backend is running (`pnpm dev` in oja-api)
2. Verify API_URL in `.env` matches your IP
3. Check IP is correct (not localhost if on device)
4. Ensure phone is on same network

## Key Files

- `oja/src/screens/LoginScreen.tsx` - Login flow (role → phone → otp)
- `oja/src/screens/onboarding/OnboardingScreens.tsx` - Signup flow
- `oja/stores/AuthStore.ts` - Auth state management
- `oja/src/lib/api.ts` - API client with token injection
- `oja/src/navigation/RootNavigator.tsx` - Auto-switches based on auth state
