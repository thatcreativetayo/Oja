import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { colors, fonts, radius, spacing } from '../constants/theme';

export function OjaMap({
  compact,
  routeMode,
  label = 'Alhaji Lekan Street',
}: {
  compact?: boolean;
  routeMode?: boolean;
  label?: string;
}) {
  return (
    <View style={[styles.mapWrap, compact && styles.compact, styles.webPlaceholder]}>
      <View style={styles.webContent}>
        <MapPin size={48} color={colors.primary} />
        <Text style={styles.webText}>{label}</Text>
        <Text style={styles.webSubtext}>Map view available on mobile</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 226,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#E6F0EA',
    borderWidth: 1,
    borderColor: colors.border,
  },
  compact: {
    height: 198,
  },
  webPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  webContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  webText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  webSubtext: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textLight,
  },
});
