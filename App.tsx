import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/constants/theme';
import { useAppFonts } from './hooks/useAppFonts';
import { MobileFrame } from './src/components/MobileFrame';
import { UniversalBackButton } from './src/components/UniversalBackButton';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    text: colors.text,
    card: colors.white,
    border: colors.border,
  },
};

export default function App() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.white,
        }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <MobileFrame>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
            <UniversalBackButton />
          </NavigationContainer>
        </AppProvider>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </MobileFrame>
  );
}
