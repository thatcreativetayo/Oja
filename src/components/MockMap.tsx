import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { Home, MapPin, Navigation, Store } from 'lucide-react-native';

import { colors, fonts, radius, spacing } from '../constants/theme';

const redemptionCity = {
  latitude: 6.8123,
  longitude: 3.4412,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

const route = [
  { latitude: 6.8098, longitude: 3.4362 },
  { latitude: 6.8104, longitude: 3.4388 },
  { latitude: 6.8121, longitude: 3.4394 },
  { latitude: 6.8141, longitude: 3.4422 },
  { latitude: 6.8165, longitude: 3.4443 },
];

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
    <View style={[styles.mapWrap, compact && styles.compact]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={redemptionCity}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}>
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
        <Marker coordinate={route[0]} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.markerBike}>
            <Navigation size={18} color={colors.primary} />
          </View>
        </Marker>
        <Marker coordinate={route[route.length - 1]} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.markerHome}>
            <Home size={18} color={colors.white} />
          </View>
        </Marker>
        {routeMode ? <Polyline coordinates={route} strokeColor="#0B376D" strokeWidth={5} /> : null}
        {!routeMode ? (
          <Marker coordinate={route[2]} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.pin}>
              <MapPin size={30} color="#3B82F6" fill="#3B82F6" />
            </View>
          </Marker>
        ) : null}
      </MapView>
      {!routeMode ? (
        <View style={styles.mapLabel}>
          <Store size={12} color={colors.white} />
          <Text style={styles.mapLabelText}>{label}</Text>
        </View>
      ) : null}
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
  markerBike: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 4,
    borderColor: '#0B376D',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerHome: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 4,
    borderColor: '#0B376D',
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLabel: {
    position: 'absolute',
    top: '50%',
    left: '28%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  mapLabelText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
});
