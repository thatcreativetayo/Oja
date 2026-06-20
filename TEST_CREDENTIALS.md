# Test Credentials for Oja App

Use these credentials to test the app with seeded data.

## Test Users

### Buyers
1. **Tunde Okafor**
   - Phone: `+2348122200011`
   - Role: Buyer
   - OTP: Use any 6-digit code (123456 recommended for testing)

2. **Amina Bello**
   - Phone: `+2348033441122`
   - Role: Buyer
   - OTP: Use any 6-digit code

3. **Chinyere Eze**
   - Phone: `+2348155667788`
   - Role: Buyer
   - OTP: Use any 6-digit code

### Riders
1. **Seun Adeyemi**
   - Phone: `+2348099887766`
   - Role: Rider
   - OTP: Use any 6-digit code
   - Rating: 4.8/5.0 (45 ratings)

2. **Emeka Nwosu**
   - Phone: `+2348077665544`
   - Role: Rider
   - OTP: Use any 6-digit code
   - Rating: 4.9/5.0 (38 ratings)

### Vendors
All vendors listed below are seeded with products:
- Phone numbers follow the pattern: +234XXXXXXXXXX
- 10 vendors with Nigerian names and Redemption City locations
- 40 products with Cloudinary images

## How to Login

1. **Open the Oja app**
2. **Select your role** (Buyer, Vendor, or Rider)
3. **Enter phone number** from the list above
4. **Click "Send OTP"**
5. **Check backend console** for the OTP (it will be logged since Twilio is optional)
6. **Enter the OTP** and verify

## Note about OTP

Since Twilio credentials may not be configured, the OTP will be **logged to the backend console**. 

Check the terminal running `pnpm dev` in the `oja-api` directory to see the OTP.

Example console output:
```
[SMS] OTP for +2348122200011: 123456
```

## Backend Seeded Data

- **10 Redemption City vendors** with store images
- **40 products** with emojis and Cloudinary images
- **6 sample orders** in various states
- **3 buyers, 2 riders** for testing

## API Base URL

Make sure your `.env` file in the oja directory has:
```
EXPO_PUBLIC_API_URL=http://YOUR_IP:5000
```

Replace `YOUR_IP` with your computer's local IP address (not localhost if testing on physical device).
