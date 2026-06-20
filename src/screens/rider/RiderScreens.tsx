import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {
  Bike,
  Clock,
  Home,
  IdCard,
  Phone,
  QrCode,
  ShieldCheck,
  Store,
  Wallet,
} from 'lucide-react-native';

import { Button, Card, EmptyState, Header, Screen, StatusBadge } from '../../components/Primitives';
import { OjaMap } from '../../components/MockMap';
import { formatNaira } from '../../constants/mockData';
import { colors, commonStyles, fonts, radius, spacing } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export function RiderJobBoardScreen({ navigation }: any) {
  const { orders, updateOrderStatus } = useApp();
  const [verified, setVerified] = useState(true);
  const jobs = orders.filter((order) =>
    ['placed', 'accepted', 'packed', 'with-rider'].includes(order.status)
  );

  if (!verified) {
    return (
      <Screen>
        <Header title="Rider Dashboard" />
        <View style={styles.content}>
          <Card style={styles.pendingCard}>
            <IdCard size={44} color={colors.warning} />
            <Text style={commonStyles.title}>KYC Pending</Text>
            <Text style={[commonStyles.body, { textAlign: 'center' }]}>
              We are reviewing your Government ID and guarantor details. This usually takes 24
              hours.
            </Text>
            <Button title="Show approved demo state" onPress={() => setVerified(true)} />
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Tunde O." subtitle="Rider dashboard" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.earningsCard}>
          <Text style={styles.today}>{"Today's earnings"}</Text>
          <Text style={styles.bigNumber}>{formatNaira(7500)}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.muted}>Deliveries Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{jobs.length}</Text>
              <Text style={styles.muted}>Available Jobs</Text>
            </View>
          </View>
        </Card>
        <View style={styles.rowBetween}>
          <Text style={commonStyles.sectionTitle}>Available Jobs</Text>
          <Text style={styles.linkText}>View all</Text>
        </View>
        {jobs.length === 0 ? (
          <EmptyState
            icon={<Bike size={34} color={colors.primary} />}
            title="No jobs available"
            body="New local deliveries will appear here once vendors accept orders."
          />
        ) : (
          jobs.map((order) => (
            <Card key={order.id} style={styles.jobCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.orderTitle}>{order.shopName}</Text>
                <View style={styles.payPill}>
                  <Text style={styles.payPillText}>{formatNaira(order.deliveryFee)}</Text>
                </View>
              </View>
              <Text style={styles.muted}>📍 0.4km away</Text>
              <View style={styles.dropoffBox}>
                <Text style={styles.muted}>Drop-off</Text>
                <Text style={styles.dropoffText} numberOfLines={2}>
                  {order.landmark}
                </Text>
              </View>
              <Button
                title={order.status === 'with-rider' ? 'Continue Delivery' : 'Accept Order'}
                variant="success"
                onPress={() => {
                  updateOrderStatus(order.id, 'with-rider');
                  navigation.navigate('RiderJobDetail', { orderId: order.id });
                }}
              />
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

export function RiderJobDetailScreen({ navigation, route }: any) {
  const { orders } = useApp();
  const order = orders.find((item) => item.id === route.params?.orderId) ?? orders[0];

  return (
    <Screen>
      <Header title="Job Detail" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ gap: spacing.md }}>
          <View style={styles.rowBetween}>
            <Text style={styles.orderTitle}>{order.id}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Detail
            icon={<Store size={20} color={colors.primary} />}
            title={order.shopName}
            body="Pickup at vendor shop"
          />
          <Detail
            icon={<Home size={20} color={colors.primary} />}
            title={order.address}
            body={order.landmark}
          />
          <Detail
            icon={<Wallet size={20} color={colors.primary} />}
            title={formatNaira(order.deliveryFee)}
            body="Rider earning for this delivery"
          />
        </Card>
        <View style={styles.actionRow}>
          <Button
            title="Call Vendor"
            variant="secondary"
            icon={<Phone size={19} color={colors.text} />}
            style={{ flex: 1 }}
          />
          <Button
            title="Call Buyer"
            variant="secondary"
            icon={<Phone size={19} color={colors.text} />}
            style={{ flex: 1 }}
          />
        </View>
        <Button
          title="Start Active Delivery"
          onPress={() => navigation.navigate('RiderActive', { orderId: order.id })}
        />
      </ScrollView>
    </Screen>
  );
}

function Detail({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.orderTitle}>{title}</Text>
        <Text style={styles.muted}>{body}</Text>
      </View>
    </View>
  );
}

export function RiderActiveDeliveryScreen({ navigation, route }: any) {
  const { orders } = useApp();
  const order = orders.find((item) => item.id === route.params?.orderId) ?? orders[0];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <OjaMap routeMode />
        <View style={styles.content}>
          <Card style={{ gap: spacing.md }}>
            <Text style={styles.orderTitle}>Active delivery</Text>
            <Text style={styles.landmark}>{order.landmark}</Text>
            <Text style={styles.muted}>
              No formal address? Use the landmark first, then call the buyer if you are close.
            </Text>
          </Card>
          <Button
            title="Show My QR Code"
            onPress={() => navigation.navigate('RiderQR', { orderId: order.id })}
            icon={<QrCode size={20} color={colors.white} />}
          />
          <Button
            title="Arrived at Drop-off"
            variant="secondary"
            onPress={() => navigation.navigate('RiderDropoff', { orderId: order.id })}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

export function RiderQRCodeScreen({ navigation, route }: any) {
  const orderId = route.params?.orderId;
  return (
    <Screen>
      <Header title="Pickup QR" onBack={() => navigation.goBack()} />
      <View style={styles.qrScreen}>
        <Card style={styles.qrCard}>
          <QRCode
            value={`OJA:RIDER:TUNDE:${orderId}:${Date.now()}`}
            size={230}
            color={colors.text}
          />
          <Text style={styles.orderTitle}>Show this to the vendor</Text>
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            Dynamic QR protects the shop from handing orders to the wrong person.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

export function RiderDropoffScreen({ navigation, route }: any) {
  const { orders, updateOrderStatus } = useApp();
  const order = orders.find((item) => item.id === route.params?.orderId) ?? orders[0];
  const [verifying, setVerifying] = useState(false);

  return (
    <Screen>
      <Header title="Drop-off Payment" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card style={{ gap: spacing.md, alignItems: 'center' }}>
          <QRCode
            value={`OJA:PAY:${order.id}:${order.subtotal + order.deliveryFee}`}
            size={210}
            color={colors.text}
          />
          <Text style={styles.bigNumber}>{formatNaira(order.subtotal + order.deliveryFee)}</Text>
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            Buyer scans or transfers now. No cash handling.
          </Text>
        </Card>
        <Button
          title={verifying ? 'Verifying Payment...' : 'Payment Confirmed'}
          loading={verifying}
          onPress={() => {
            setVerifying(true);
            setTimeout(() => {
              updateOrderStatus(order.id, 'delivered');
              setVerifying(false);
              navigation.navigate('RiderJobs');
            }, 900);
          }}
        />
      </View>
    </Screen>
  );
}

export function RiderEarningsScreen() {
  const { orders } = useApp();
  const delivered = orders.filter((order) => ['paid', 'delivered'].includes(order.status));
  const total = delivered.reduce((sum, order) => sum + order.deliveryFee, 7500);

  return (
    <Screen>
      <Header title="Earnings" />
      <View style={styles.content}>
        <Card style={styles.earningsCard}>
          <Wallet size={32} color={colors.primary} />
          <Text style={styles.bigNumber}>{formatNaira(total)}</Text>
          <Text style={styles.muted}>Includes completed demo deliveries</Text>
        </Card>
        <Card style={styles.detailRow}>
          <Clock size={22} color={colors.warning} />
          <View>
            <Text style={styles.orderTitle}>Next payout</Text>
            <Text style={styles.muted}>Today by 8:00 PM</Text>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

export function RiderProfileScreen() {
  const { resetDemo } = useApp();
  return (
    <Screen>
      <Header title="Rider Profile" />
      <View style={styles.content}>
        <Card style={{ gap: spacing.md }}>
          <ShieldCheck size={28} color={colors.success} />
          <Text style={commonStyles.title}>Tunde O.</Text>
          <Text style={commonStyles.body}>Verified community rider • 0812 220 0011</Text>
        </Card>
        <Button title="Switch role / restart demo" variant="secondary" onPress={resetDemo} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  pendingCard: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  earningsCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  today: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  bigNumber: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  statBox: {
    flex: 1,
    minHeight: 74,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  statNumber: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 17,
  },
  muted: {
    color: colors.placeholder,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  linkText: {
    color: colors.primary,
    fontFamily: fonts.medium,
  },
  jobCard: {
    gap: spacing.md,
  },
  orderTitle: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 16,
  },
  payPill: {
    borderRadius: radius.pill,
    backgroundColor: colors.softGreen,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  payPillText: {
    color: '#047857',
    fontFamily: fonts.medium,
  },
  dropoffBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  dropoffText: {
    marginTop: 5,
    color: colors.text,
    fontFamily: fonts.body,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.softRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landmark: {
    color: colors.text,
    fontFamily: fonts.medium,
    lineHeight: 22,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  qrScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  qrCard: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
  },
});
