import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  QrCode,
  Store,
  Wallet,
} from 'lucide-react-native';

import {
  Button,
  Card,
  EmptyState,
  Header,
  Input,
  Screen,
  StatusBadge,
} from '../../components/Primitives';
import { formatNaira, products } from '../../constants/mockData';
import { colors, commonStyles, fonts, radius, spacing } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

const InventoryTabs = createMaterialTopTabNavigator();

export function VendorDashboardScreen({ navigation }: any) {
  const { orders, updateOrderStatus } = useApp();
  const activeOrders = orders.filter((order) =>
    ['placed', 'accepted', 'packed'].includes(order.status)
  );

  return (
    <Screen>
      <Header title="Vendor Dashboard" subtitle="Iya Risi Canteen" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.vendorHero}>
          <Text style={styles.bigNumber}>{activeOrders.length}</Text>
          <Text style={styles.heroLabel}>Active orders waiting for action</Text>
        </Card>
        <Text style={commonStyles.sectionTitle}>Active Orders</Text>
        {activeOrders.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={34} color={colors.primary} />}
            title="No active orders"
            body="New buyer orders will appear here immediately."
          />
        ) : (
          activeOrders.map((order) => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.orderTitle}>{order.id}</Text>
                  <Text style={styles.muted}>
                    {order.buyerName} • {order.items.length} item(s)
                  </Text>
                </View>
                <StatusBadge status={order.status} />
              </View>
              <Text style={styles.landmark} numberOfLines={2}>
                {order.landmark}
              </Text>
              <View style={styles.actionRow}>
                <Button
                  title="View"
                  variant="secondary"
                  onPress={() => navigation.navigate('VendorOrderDetail', { orderId: order.id })}
                  style={{ flex: 1 }}
                />
                {order.status === 'placed' ? (
                  <Button
                    title="Accept"
                    onPress={() => updateOrderStatus(order.id, 'accepted')}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <Button
                    title="Ready"
                    variant="success"
                    onPress={() => updateOrderStatus(order.id, 'packed')}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

export function VendorOrderDetailScreen({ navigation, route }: any) {
  const { orders, updateOrderStatus } = useApp();
  const order = orders.find((item) => item.id === route.params?.orderId) ?? orders[0];
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = order.items.every((item) => checked[item.product.id]);

  return (
    <Screen>
      <Header title="Order Detail" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ gap: spacing.md }}>
          <View style={styles.rowBetween}>
            <Text style={styles.orderTitle}>{order.id}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.muted}>{order.buyerName}</Text>
          <Text style={styles.landmark}>{order.landmark}</Text>
        </Card>
        <Text style={commonStyles.sectionTitle}>Pack checklist</Text>
        {order.items.map((item) => (
          <Pressable
            key={item.product.id}
            onPress={() =>
              setChecked((current) => ({
                ...current,
                [item.product.id]: !current[item.product.id],
              }))
            }
            style={styles.checkItem}>
            <View style={[styles.checkCircle, checked[item.product.id] && styles.checkCircleOn]}>
              {checked[item.product.id] ? <CheckCircle2 size={22} color={colors.white} /> : null}
            </View>
            <Text style={styles.itemEmoji}>{item.product.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderTitle}>{item.product.name}</Text>
              <Text style={styles.muted}>
                Qty {item.quantity} • {formatNaira(item.product.price)}
              </Text>
            </View>
          </Pressable>
        ))}
        <Button
          title="Mark Ready for Pickup"
          disabled={!allChecked}
          onPress={() => updateOrderStatus(order.id, 'packed')}
        />
        <Button
          title="Scan Rider QR"
          variant="secondary"
          onPress={() => navigation.navigate('VendorScanner', { orderId: order.id })}
          icon={<QrCode size={20} color={colors.text} />}
        />
      </ScrollView>
    </Screen>
  );
}

export function VendorScannerScreen({ navigation, route }: any) {
  const { updateOrderStatus } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const orderId = route.params?.orderId;

  return (
    <Screen>
      <Header title="Scan Rider QR" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.orderTitle}>Secure handover</Text>
          <Text style={styles.muted}>
            {"Scan the rider's dynamic QR code before releasing goods."}
          </Text>
        </Card>
        <View style={styles.cameraBox}>
          {permission?.granted ? (
            <CameraView style={StyleSheet.absoluteFill} facing="back" />
          ) : (
            <View style={styles.cameraFallback}>
              <Camera size={44} color={colors.primary} />
              <Text style={styles.muted}>Camera permission is needed for live scanning.</Text>
              <Button title="Allow Camera" onPress={requestPermission} />
            </View>
          )}
          <View style={styles.scanFrame} />
        </View>
        <Button
          title="Mock Scan Successful"
          onPress={() => {
            updateOrderStatus(orderId, 'with-rider');
            Alert.alert('QR verified', 'Order released to the assigned rider.');
            navigation.goBack();
          }}
        />
      </View>
    </Screen>
  );
}

function InventoryList() {
  const [inventory, setInventory] = useState(
    products.filter((product) => product.shopId === 'iya-risi')
  );
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {inventory.map((product) => (
        <Card key={product.id} style={styles.inventoryRow}>
          <Text style={styles.itemEmoji}>{product.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderTitle}>{product.name}</Text>
            <Text style={styles.muted}>
              {formatNaira(product.price)} • {product.unit}
            </Text>
          </View>
          <Switch
            value={product.inStock}
            trackColor={{ true: colors.softGreen, false: colors.border }}
            thumbColor={product.inStock ? colors.success : colors.placeholder}
            onValueChange={() =>
              setInventory((current) =>
                current.map((item) =>
                  item.id === product.id ? { ...item, inStock: !item.inStock } : item
                )
              )
            }
          />
        </Card>
      ))}
    </ScrollView>
  );
}

function AddProductForm() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={commonStyles.sectionTitle}>Add product</Text>
      <Input placeholder="Product name" />
      <Input placeholder="Price e.g 4000" keyboardType="numeric" />
      <Input placeholder="Unit e.g 1 plate, 5kg, pack" />
      <Card style={styles.uploadBox}>
        <Plus size={30} color={colors.primary} />
        <Text style={styles.orderTitle}>Add product photo</Text>
        <Text style={styles.muted}>Lightweight upload placeholder for the prototype.</Text>
      </Card>
      <Button
        title="Save Product"
        onPress={() => Alert.alert('Saved', 'Product added to mock inventory.')}
      />
    </ScrollView>
  );
}

export function VendorInventoryScreen() {
  return (
    <Screen>
      <Header title="Inventory" />
      <InventoryTabs.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.secondary,
          tabBarLabelStyle: { fontFamily: fonts.medium, textTransform: 'none' },
          tabBarIndicatorStyle: { backgroundColor: colors.primary },
        }}>
        <InventoryTabs.Screen name="Products" component={InventoryList} />
        <InventoryTabs.Screen name="Add/Edit" component={AddProductForm} />
      </InventoryTabs.Navigator>
    </Screen>
  );
}

export function VendorEarningsScreen() {
  const { orders } = useApp();
  const total = orders.reduce((sum, order) => sum + order.subtotal, 0);

  return (
    <Screen>
      <Header title="Earnings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.earningsCard}>
          <Wallet size={28} color={colors.primary} />
          <Text style={styles.bigNumber}>{formatNaira(total)}</Text>
          <Text style={styles.heroLabel}>Mock sales from Oja orders</Text>
        </Card>
        <Card style={styles.rowBetween}>
          <Text style={styles.orderTitle}>Pending settlement</Text>
          <Text style={styles.orderTitle}>{formatNaira(12000)}</Text>
        </Card>
        <Card style={styles.rowBetween}>
          <Text style={styles.orderTitle}>Paid this week</Text>
          <Text style={styles.orderTitle}>{formatNaira(38500)}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

export function VendorProfileScreen() {
  const { resetDemo } = useApp();
  return (
    <Screen>
      <Header title="Shop Profile" />
      <View style={styles.content}>
        <Card style={{ gap: spacing.md }}>
          <Store size={28} color={colors.primary} />
          <Text style={commonStyles.title}>Iya Risi Canteen</Text>
          <Text style={commonStyles.body}>Food Canteen • Beside Youth Centre, Redemption City</Text>
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
  vendorHero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  bigNumber: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 34,
  },
  heroLabel: {
    color: colors.secondary,
    fontFamily: fonts.body,
  },
  orderCard: {
    gap: spacing.lg,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  orderTitle: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 16,
  },
  muted: {
    color: colors.placeholder,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  landmark: {
    color: colors.secondary,
    fontFamily: fonts.medium,
    lineHeight: 21,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleOn: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  itemEmoji: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.surface,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 30,
    overflow: 'hidden',
  },
  cameraBox: {
    height: 360,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  cameraFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  scanFrame: {
    position: 'absolute',
    top: 82,
    left: 54,
    right: 54,
    bottom: 82,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  uploadBox: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    gap: spacing.sm,
  },
  earningsCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
});
