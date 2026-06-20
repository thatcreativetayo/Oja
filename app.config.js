export default {
  expo: {
    name: 'oja',
    slug: 'oja',
    version: '1.0.0',
    web: {
      favicon: './assets/favicon.png',
    },
    experiments: {
      tsconfigPaths: true,
    },
    plugins: ['expo-barcode-scanner'],
    scheme: 'oja',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.thatcreative.oja',
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000',
      eas: {
        projectId: '063ae889-40da-4d4b-9e23-a7b8a1201a41',
      },
    },
  },
};
