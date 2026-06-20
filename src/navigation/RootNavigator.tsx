import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Bike,
  ClipboardList,
  Home,
  Package,
  Receipt,
  Store,
  User,
  Wallet,
} from 'lucide-react-native';

import { colors, fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';
import {
  RoleIntroScreen,
  RoleSelectionScreen,
  SplashScreen,
  VerifyPhoneScreen,
} from '../screens/onboarding/OnboardingScreens';
import {
  BuyerCartScreen,
  BuyerCheckoutScreen,
  BuyerHistoryScreen,
  BuyerHomeScreen,
  BuyerOrderPlacedScreen,
  BuyerPaymentScreen,
  BuyerProductScreen,
  BuyerProfileScreen,
  BuyerStorefrontScreen,
  BuyerTrackingScreen,
} from '../screens/buyer/BuyerScreens';
import {
  VendorDashboardScreen,
  VendorEarningsScreen,
  VendorInventoryScreen,
  VendorOrderDetailScreen,
  VendorProfileScreen,
  VendorScannerScreen,
} from '../screens/vendor/VendorScreens';
import {
  RiderActiveDeliveryScreen,
  RiderDropoffScreen,
  RiderEarningsScreen,
  RiderJobBoardScreen,
  RiderJobDetailScreen,
  RiderProfileScreen,
  RiderQRCodeScreen,
} from '../screens/rider/RiderScreens';

const RootStack = createNativeStackNavigator();
const BuyerStack = createNativeStackNavigator();
const VendorStack = createNativeStackNavigator();
const RiderStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function screenOptions() {
  return {
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  };
}

function tabOptions() {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.ink,
    tabBarLabelStyle: {
      fontFamily: fonts.medium,
      fontSize: 11,
      paddingBottom: 4,
    },
    tabBarStyle: {
      height: 72,
      paddingTop: 8,
      borderTopColor: '#EEF2F7',
      backgroundColor: colors.white,
    },
  };
}

function BuyerStackNavigator() {
  return (
    <BuyerStack.Navigator screenOptions={screenOptions}>
      <BuyerStack.Screen name="BuyerHome" component={BuyerHomeScreen} />
      <BuyerStack.Screen name="Storefront" component={BuyerStorefrontScreen} />
      <BuyerStack.Screen name="ProductDetail" component={BuyerProductScreen} />
      <BuyerStack.Screen name="Cart" component={BuyerCartScreen} />
      <BuyerStack.Screen name="Checkout" component={BuyerCheckoutScreen} />
      <BuyerStack.Screen name="OrderPlaced" component={BuyerOrderPlacedScreen} />
      <BuyerStack.Screen name="Tracking" component={BuyerTrackingScreen} />
      <BuyerStack.Screen name="Payment" component={BuyerPaymentScreen} />
    </BuyerStack.Navigator>
  );
}

function VendorStackNavigator() {
  return (
    <VendorStack.Navigator screenOptions={screenOptions}>
      <VendorStack.Screen name="VendorDashboard" component={VendorDashboardScreen} />
      <VendorStack.Screen name="VendorOrderDetail" component={VendorOrderDetailScreen} />
      <VendorStack.Screen name="VendorScanner" component={VendorScannerScreen} />
    </VendorStack.Navigator>
  );
}

function RiderStackNavigator() {
  return (
    <RiderStack.Navigator screenOptions={screenOptions}>
      <RiderStack.Screen name="RiderJobs" component={RiderJobBoardScreen} />
      <RiderStack.Screen name="RiderJobDetail" component={RiderJobDetailScreen} />
      <RiderStack.Screen name="RiderActive" component={RiderActiveDeliveryScreen} />
      <RiderStack.Screen name="RiderQR" component={RiderQRCodeScreen} />
      <RiderStack.Screen name="RiderDropoff" component={RiderDropoffScreen} />
    </RiderStack.Navigator>
  );
}

function BuyerTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="Market"
        component={BuyerStackNavigator}
        options={{ tabBarIcon: ({ color }) => <Home size={22} color={color} /> }}
      />
      <Tab.Screen
        name="Orders"
        component={BuyerHistoryScreen}
        options={{ tabBarIcon: ({ color }) => <Receipt size={22} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={BuyerProfileScreen}
        options={{ tabBarIcon: ({ color }) => <User size={22} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function VendorTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="Dashboard"
        component={VendorStackNavigator}
        options={{ tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} /> }}
      />
      <Tab.Screen
        name="Inventory"
        component={VendorInventoryScreen}
        options={{ tabBarIcon: ({ color }) => <Package size={22} color={color} /> }}
      />
      <Tab.Screen
        name="Earnings"
        component={VendorEarningsScreen}
        options={{ tabBarIcon: ({ color }) => <Wallet size={22} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={VendorProfileScreen}
        options={{ tabBarIcon: ({ color }) => <Store size={22} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function RiderTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="Dashboard"
        component={RiderStackNavigator}
        options={{ tabBarIcon: ({ color }) => <Bike size={22} color={color} /> }}
      />
      <Tab.Screen
        name="Earnings"
        component={RiderEarningsScreen}
        options={{ tabBarIcon: ({ color }) => <Wallet size={22} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={RiderProfileScreen}
        options={{ tabBarIcon: ({ color }) => <User size={22} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { role, onboarded } = useApp();

  if (!role || !onboarded) {
    return (
      <RootStack.Navigator screenOptions={screenOptions}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <RootStack.Screen name="VerifyPhone" component={VerifyPhoneScreen} />
        <RootStack.Screen name="RoleIntro" component={RoleIntroScreen} />
      </RootStack.Navigator>
    );
  }

  if (role === 'vendor') {
    return <VendorTabs />;
  }

  if (role === 'rider') {
    return <RiderTabs />;
  }

  return <BuyerTabs />;
}
