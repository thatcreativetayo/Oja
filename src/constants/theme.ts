import { Platform, StyleSheet } from 'react-native';

export const colors = {
  primary: '#EB0031',
  primaryDark: '#C9002B',
  background: '#F9FAFB',
  white: '#FFFFFF',
  text: '#111827',
  secondary: '#4B5563',
  placeholder: '#9CA3AF',
  border: '#E5E7EB',
  surface: '#F3F4F6',
  success: '#10B981',
  warning: '#F59E0B',
  destructive: '#EF4444',
  ink: '#0F172A',
  softRed: '#FFE8EE',
  softGreen: '#DDFBEA',
  softAmber: '#FEF3C7',
};

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  title: 'BricolageGrotesque_600SemiBold',
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semi: 'DMSans_600SemiBold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  input: 12,
  card: 16,
  pill: 9999,
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  android: {
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.90,
    shadowRadius: 8,
  },
  default: {
    elevation: 3,
  },
});

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 18,
  },
  body: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
