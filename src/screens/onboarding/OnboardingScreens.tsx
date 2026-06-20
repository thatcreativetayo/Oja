import { ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Bike,
  CreditCard,
  IdCard,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Store,
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

import { Button, Card, Input, Screen } from '../../components/Primitives';
import { colors, commonStyles, fonts, radius, spacing } from '../../constants/theme';
import { Role } from '../../constants/mockData';
import { useApp } from '../../context/AppContext';
import { useAuthStore } from '../../../stores/AuthStore';

export function SplashScreen({ navigation }: any) {
  const { user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      // If user is authenticated, they'll be routed by RootNavigator
      // If not authenticated, go to Login
      if (!user) {
        navigation.replace('Login');
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [navigation, user]);

  return (
    <Screen style={styles.splash}>
      <View style={styles.logoMark}>
        <ShoppingBasket size={58} color={colors.white} />
      </View>
      <Text style={styles.logoText}>Oja</Text>
      <Text style={styles.tagline}>Your neighbourhood market, delivered.</Text>
      <View style={styles.splashPill}>
        <Text style={styles.splashPillText}>Built for Redemption City</Text>
      </View>
    </Screen>
  );
}

export function RoleSelectionScreen({ navigation }: any) {
  const { setRole } = useApp();

  const chooseRole = (role: Role) => {
    setRole(role);
    navigation.navigate('VerifyPhone');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={commonStyles.title}>Welcome to Oja</Text>
        <Text style={[commonStyles.body, styles.intro]}>
          Choose how you want to use your local market today.
        </Text>
        <RoleCard
          title="Buyer"
          body="Order food, groceries, drinks, gas, and household items from shops near you."
          icon={<ShoppingBasket size={26} color={colors.primary} />}
          onPress={() => chooseRole('buyer')}
        />
        <RoleCard
          title="Vendor"
          body="Receive local orders, mark items ready, and release goods securely to verified riders."
          icon={<Store size={26} color={colors.primary} />}
          onPress={() => chooseRole('vendor')}
        />
        <RoleCard
          title="Rider"
          body="Earn from short community deliveries with QR-protected pickup and payment verification."
          icon={<Bike size={26} color={colors.primary} />}
          onPress={() => chooseRole('rider')}
        />
        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}>
          <Text style={styles.loginLinkText}>Already have an account? Login</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function RoleCard({
  title,
  body,
  icon,
  onPress,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.roleCard, pressed && { opacity: 0.85 }]}>
      <View style={styles.roleIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleBody}>{body}</Text>
      </View>
    </Pressable>
  );
}

export function VerifyPhoneScreen({ navigation }: any) {
  const [phone, setPhone] = useState('8122200011');
  const [otp, setOtp] = useState('');
  const canContinue = phone.length >= 10 && otp.length >= 4;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <Smartphone size={28} color={colors.primary} />
        </View>
        <Text style={commonStyles.title}>Verify your number</Text>
        <Text style={[commonStyles.body, styles.intro]}>
          We will send a mock OTP to this Nigerian phone number.
        </Text>
        <Text style={styles.label}>Phone number</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.prefix}>NG +234</Text>
          <Input
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.phoneInput}
          />
        </View>
        <Text style={styles.label}>Enter OTP</Text>
        <View style={styles.otpRow}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Pressable
              key={index}
              style={[styles.otpBox, index === otp.length && styles.otpBoxActive]}>
              <Text style={styles.otpText}>{otp[index] ?? ''}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.keypad}>
          {'1234567890'.split('').map((digit) => (
            <Pressable
              key={digit}
              onPress={() => setOtp((current) => (current + digit).slice(0, 6))}
              style={styles.key}>
              <Text style={styles.keyText}>{digit}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setOtp((current) => current.slice(0, -1))} style={styles.key}>
            <Text style={styles.keyText}>⌫</Text>
          </Pressable>
        </View>
        <Button
          title="Continue"
          disabled={!canContinue}
          onPress={() => navigation.navigate('RoleIntro')}
        />
      </ScrollView>
    </Screen>
  );
}

export function RoleIntroScreen() {
  const { role, completeOnboarding, updateProfile } = useApp();
  const [name, setName] = useState(role === 'vendor' ? 'Iya Risi Canteen' : 'Tunde O.');
  const [community, setCommunity] = useState('Redemption City, Ogun');
  const [idType, setIdType] = useState('National identity number (NIN)');

  if (role === 'rider') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={commonStyles.title}>ID Verification</Text>
          <Text style={[commonStyles.body, styles.intro]}>
            We verify every rider to keep our community safe.
          </Text>
          <Card style={styles.kycCard}>
            <IdCard size={24} color={colors.ink} />
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTitle}>Government ID</Text>
              <Text style={styles.roleBody}>{"NIN, BVN, Driver's Licence, or Voter's Card"}</Text>
            </View>
          </Card>
          <Card style={styles.kycCard}>
            <ShieldCheck size={24} color={colors.ink} />
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTitle}>Guarantor Details</Text>
              <Text style={styles.roleBody}>A community member who can vouch for you</Text>
            </View>
          </Card>
          <Text style={styles.label}>Select ID</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={idType} onValueChange={setIdType}>
              <Picker.Item
                label="National identity number (NIN)"
                value="National identity number (NIN)"
              />
              <Picker.Item label="Driver's Licence" value="Driver's Licence" />
              <Picker.Item label="Voter's Card" value="Voter's Card" />
            </Picker>
          </View>
          <Text style={styles.label}>Guarantor full name</Text>
          <Input placeholder="e.g Pastor Kunle Adeyemi" />
          <Text style={styles.label}>Guarantor address</Text>
          <Input
            placeholder="Where they live in the community"
            multiline
            style={{ height: 86, paddingTop: 14 }}
          />
          <Button
            title="Submit for Review"
            onPress={completeOnboarding}
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (role === 'vendor') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={commonStyles.title}>Create Vendor Account</Text>
          <Text style={[commonStyles.body, styles.intro]}>
            Set up your shop so neighbours can order from you.
          </Text>
          <Text style={styles.label}>Shop name</Text>
          <Input value={name} onChangeText={setName} />
          <Text style={styles.label}>Shop category</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue="Food Canteen">
              <Picker.Item label="Food Canteen" value="Food Canteen" />
              <Picker.Item label="Grocery Store" value="Grocery Store" />
              <Picker.Item label="Gas & Household" value="Gas & Household" />
            </Picker>
          </View>
          <Text style={styles.label}>Closest landmark</Text>
          <Input placeholder="e.g Beside Youth Centre, Redemption City" />
          <Card style={styles.upload}>
            <Store size={30} color={colors.primary} />
            <Text style={styles.uploadText}>Tap to upload shop photo</Text>
            <Text style={styles.roleBody}>Jpg or PNG up to 5mb</Text>
          </Card>
          <Button title="Go to Dashboard" onPress={completeOnboarding} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={commonStyles.title}>Create Buyer Account</Text>
        <Text style={[commonStyles.body, styles.intro]}>
          Tell shops and riders where to find you in Redemption City.
        </Text>
        <Text style={styles.label}>Full name</Text>
        <Input value={name} onChangeText={setName} />
        <Text style={styles.label}>Community / Area</Text>
        <Input value={community} onChangeText={setCommunity} />
        <Card style={styles.trustCard}>
          <CreditCard size={22} color={colors.success} />
          <Text style={styles.trustText}>
            No upfront payment. Pay by transfer or QR only when your order arrives safely.
          </Text>
        </Card>
        <Button
          title="Start Shopping"
          onPress={() => {
            updateProfile({ name, community });
            completeOnboarding();
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoMark: {
    width: 112,
    height: 112,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    fontFamily: fonts.display,
    fontSize: 46,
    color: colors.text,
  },
  tagline: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
  splashPill: {
    marginTop: spacing.xxl,
    borderRadius: radius.pill,
    backgroundColor: colors.softRed,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  splashPillText: {
    color: colors.primary,
    fontFamily: fonts.medium,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  intro: {
    marginBottom: spacing.lg,
  },
  roleCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.softRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontFamily: fonts.title,
    color: colors.text,
    fontSize: 16,
  },
  roleBody: {
    marginTop: 4,
    fontFamily: fonts.body,
    color: colors.placeholder,
    fontSize: 14,
    lineHeight: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.softRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.md,
    marginBottom: -4,
    fontFamily: fonts.medium,
    color: colors.text,
    fontSize: 15,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: spacing.lg,
    color: colors.placeholder,
    fontFamily: fonts.medium,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 0,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  otpBoxActive: {
    borderColor: colors.primary,
    backgroundColor: '#FDE2E8',
  },
  otpText: {
    fontFamily: fonts.title,
    fontSize: 20,
  },
  keypad: {
    marginVertical: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  key: {
    width: '31%',
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: fonts.medium,
    fontSize: 22,
  },
  kycCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  upload: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    marginVertical: spacing.lg,
  },
  uploadText: {
    fontFamily: fonts.medium,
    color: colors.text,
    fontSize: 16,
  },
  trustCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  trustText: {
    flex: 1,
    fontFamily: fonts.medium,
    color: colors.text,
    lineHeight: 21,
  },
});
  loginLink: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loginLinkText: {
    color: colors.primary,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
