import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { colors, commonStyles, fonts, radius, shadow, spacing } from '../constants/theme';
import { OrderStatus } from '../constants/mockData';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <SafeAreaView style={[commonStyles.screen, style]}>{children}</SafeAreaView>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'success' && styles.buttonSuccess,
    variant === 'ghost' && styles.buttonGhost,
    variant === 'danger' && styles.buttonDanger,
    disabled && styles.buttonDisabled,
    style,
  ];
  const textStyle = [
    styles.buttonText,
    (variant === 'secondary' || variant === 'ghost') && styles.buttonTextDark,
    disabled && styles.buttonTextDisabled,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [buttonStyle, pressed && styles.pressed]}>
      {loading ? <ActivityIndicator color={colors.white} /> : icon}
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Input({ style, ...props }: TextInputProps) {
  return (
    <TextInput placeholderTextColor={colors.placeholder} style={[styles.input, style]} {...props} />
  );
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function StatusBadge({ status }: { status: OrderStatus | 'open' | 'pending' | 'verified' }) {
  const labelMap: Record<string, string> = {
    placed: 'New',
    accepted: 'Accepted',
    packed: 'Ready',
    'with-rider': 'With Rider',
    arrived: 'Arrived',
    paid: 'Paid',
    delivered: 'Delivered',
    open: 'Open',
    pending: 'Pending',
    verified: 'Verified',
  };
  const isSuccess = ['delivered', 'paid', 'open', 'verified'].includes(status);
  const isWarning = ['accepted', 'packed', 'pending', 'arrived'].includes(status);
  return (
    <View
      style={[styles.badge, isSuccess && styles.badgeSuccess, isWarning && styles.badgeWarning]}>
      <Text
        style={[
          styles.badgeText,
          isSuccess && styles.badgeSuccessText,
          isWarning && styles.badgeWarningText,
        ]}>
        {labelMap[status]}
      </Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function OfflineBanner() {
  return (
    <View style={styles.offline}>
      <Text style={styles.offlineText}>
        Offline-ready demo: orders sync instantly in this prototype.
      </Text>
    </View>
  );
}

export function SkeletonRows() {
  return (
    <View style={{ gap: spacing.md }}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeleton} />
      ))}
    </View>
  );
}

export const textStyles = StyleSheet.create({
  title: commonStyles.title as TextStyle,
  sectionTitle: commonStyles.sectionTitle as TextStyle,
  body: commonStyles.body as TextStyle,
});

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDanger: {
    backgroundColor: colors.destructive,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.semi,
    fontSize: 16,
  },
  buttonTextDark: {
    color: colors.text,
  },
  buttonTextDisabled: {
    color: colors.placeholder,
  },
  pressed: {
    opacity: 0.82,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadow,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  header: {
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 38,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 20,
  },
  headerSubtitle: {
    marginTop: 2,
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  headerRight: {
    width: 38,
    alignItems: 'flex-end',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.softRed,
  },
  badgeSuccess: {
    backgroundColor: colors.softGreen,
  },
  badgeWarning: {
    backgroundColor: colors.softAmber,
  },
  badgeText: {
    color: colors.primary,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  badgeSuccessText: {
    color: '#047857',
  },
  badgeWarningText: {
    color: '#92400E',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.softRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  offline: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderWidth: 1,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  offlineText: {
    color: '#9A3412',
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  skeleton: {
    height: 86,
    borderRadius: radius.card,
    backgroundColor: '#EEF2F7',
  },
});
