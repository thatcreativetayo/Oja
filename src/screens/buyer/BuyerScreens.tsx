import { useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Banknote,
  Bell,
  Bike,
  CheckCircle2,
  CreditCard,
  History,
  MapPin,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  QrCode,
  Search,
  ShoppingBasket,
  Star,
  Trash2,
} from 'lucide-react-native';

import {
  Button,
  Card,
  EmptyState,
  Header,
  Input,
  OfflineBanner,
  Screen,
  StatusBadge,
} from '../../components/Primitives';
import { OjaMap } from '../../components/MockMap';
import { categories, formatNaira, Product, products, Shop, shops } from '../../constants/mockData';
import { colors, commonStyles, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export function BuyerHomeScreen({ navigation }: any) {
  const { cartCount, profile } = useApp();
  const [query, setQuery] = useState('');
  const filteredShops = shops.filter((shop) =>
    `${shop.name} ${shop.category}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Image style={{
              position: "absolute",
              left: -18,
              top: -35,
              width: 365,
              height: 238,
              zIndex: 0
            }} source={require("../../../assets/buyerscreen.png")} />
            <View style={styles.locationRow}>
              <MapPin size={19} color={colors.text} />
              <Text style={styles.locationText}>{profile.community.replace(', Ogun', '')}</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Cart')} style={styles.cartIcon}>
              <ShoppingBasket size={22} color={colors.text} />
              {cartCount ? <Text style={styles.cartCount}>{cartCount}</Text> : null}
            </Pressable>
          </View>
          {/* <Text style={styles.heroTitle}>
            Fresh local market runs, without leaving your street.
          </Text> */}
          <View style={styles.searchBox}>
            <Search size={20} color={colors.placeholder} />
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search shop or items..."
              style={styles.searchInput}
            />
          </View>
        </View>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <Pressable key={category.id} style={styles.categoryCard}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </Pressable>
          ))}
        </View>
        <OfflineBanner />
        <View style={styles.sectionHeader}>
          <Text style={commonStyles.sectionTitle}>Shops near you</Text>
          <Text style={styles.linkText}>View all</Text>
        </View>
        <View style={styles.shopGrid}>
          {filteredShops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onPress={() => navigation.navigate('Storefront', { shopId: shop.id })}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ShopCard({ shop, onPress }: { shop: Shop; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.shopCard}>
      <View style={[styles.shopImage, { backgroundColor: shop.accent }]}>
        <Text style={styles.shopHeroText}>{shop.hero}</Text>
        <Text style={styles.shopAwning}>OPEN TODAY</Text>
      </View>
      <Text style={styles.shopName}>{shop.name}</Text>
      <Text style={styles.shopEta}>{shop.eta}</Text>
      <View style={styles.shopMeta}>
        <StatusBadge status="open" />
        <View style={styles.ratingRow}>
          <Star size={15} color="#FACC15" fill="#FACC15" />
          <Text style={styles.ratingText}>{shop.rating}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function BuyerStorefrontScreen({ navigation, route }: any) {
  const shop = shops.find((item) => item.id === route.params?.shopId) ?? shops[0];
  const items = products.filter((product) => product.shopId === shop.id);
  const { cartCount, cartSubtotal } = useApp();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: cartCount ? 110 : spacing.xxl }}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.storeHero, { backgroundColor: shop.accent }]}>
          <Header
            title=""
            onBack={() => navigation.goBack()}
            right={<Bell size={22} color={colors.text} />}
          />
          <Text style={styles.storeSign}>{shop.hero}</Text>
          <Text style={styles.storeName}>{shop.name}</Text>
          <Text style={styles.storeInfo}>⭐ {shop.rating} Top rated store</Text>
          <Text style={styles.storeInfo}>Delivery in {shop.eta}</Text>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={commonStyles.sectionTitle}>Available items</Text>
          <Text style={styles.payLater}>Pay on delivery</Text>
        </View>
        <View style={styles.productGrid}>
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
            />
          ))}
        </View>
      </ScrollView>
      {cartCount ? (
        <Pressable onPress={() => navigation.navigate('Cart')} style={styles.cartBar}>
          <Text style={styles.cartBubble}>{cartCount}</Text>
          <Text style={styles.cartBarText}>View Cart</Text>
          <Text style={styles.cartBarText}>{formatNaira(cartSubtotal)}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { addToCart, removeFromCart, cart } = useApp();
  const quantity = cart.find((item) => item.product.id === product.id)?.quantity ?? 0;
  return (
    <Pressable onPress={onPress} style={styles.productCard}>
      <View style={styles.productImage}>
        <Text style={styles.productEmoji}>{product.emoji}</Text>
        <View style={styles.productAdd}>
          {quantity ? (
            <>
              <Pressable onPress={() => removeFromCart(product.id)}>
                <Trash2 size={17} color={colors.text} />
              </Pressable>
              <Text style={styles.quantity}>{quantity}</Text>
            </>
          ) : null}
          <Pressable onPress={() => addToCart(product)}>
            <Plus size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>{formatNaira(product.price)}</Text>
    </Pressable>
  );
}

export function BuyerProductScreen({ navigation, route }: any) {
  const product = products.find((item) => item.id === route.params?.productId) ?? products[0];
  const { addToCart } = useApp();

  return (
    <Screen>
      <Header title="Product" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.detailImage}>
          <Text style={styles.detailEmoji}>{product.emoji}</Text>
        </View>
        <Text style={commonStyles.title}>{product.name}</Text>
        <Text style={styles.detailPrice}>{formatNaira(product.price)}</Text>
        <Text style={commonStyles.body}>{product.description}</Text>
        <Card style={styles.trustCard}>
          <CreditCard size={22} color={colors.success} />
          <Text style={styles.trustText}>
            Pay when the rider arrives. Your money is confirmed digitally before the order closes.
          </Text>
        </Card>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Add to Cart"
          onPress={() => addToCart(product)}
          icon={<Plus size={20} color={colors.white} />}
        />
      </View>
    </Screen>
  );
}

export function BuyerCartScreen({ navigation }: any) {
  const { cart, addToCart, removeFromCart, cartSubtotal } = useApp();

  return (
    <Screen>
      <Header title="View Cart" onBack={() => navigation.goBack()} />
      {cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingBasket size={34} color={colors.primary} />}
          title="Your cart is empty"
          body="Add items from nearby shops and they will appear here."
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            {cart.map((item) => (
              <Card key={item.product.id} style={styles.cartItem}>
                <Text style={styles.cartEmoji}>{item.product.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  <Text style={styles.productPrice}>{formatNaira(item.product.price)}</Text>
                </View>
                <View style={styles.counter}>
                  <Pressable onPress={() => removeFromCart(item.product.id)}>
                    <Minus size={17} color={colors.text} />
                  </Pressable>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <Pressable onPress={() => addToCart(item.product)}>
                    <Plus size={17} color={colors.text} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatNaira(cartSubtotal)}</Text>
            </View>
            <Button title="Proceed to Checkout" onPress={() => navigation.navigate('Checkout')} />
          </View>
        </>
      )}
    </Screen>
  );
}

export function BuyerCheckoutScreen({ navigation }: any) {
  const { cartSubtotal, placeOrder } = useApp();
  const [landmark, setLandmark] = useState(
    'Yellow gate opposite RCCG youth church, beside the mallam selling fruits'
  );
  const [address, setAddress] = useState('Salisu Street');
  const deliveryFee = 550;

  return (
    <Screen>
      <Header title="Check out" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.helper}>ⓘ Tap to pin your location</Text>
        <OjaMap compact />
        <Text style={styles.checkoutTitle}>Closest landmark & description</Text>
        <Input value={landmark} onChangeText={setLandmark} multiline style={styles.landmarkInput} />
        <Text style={styles.helper}>
          {'e.g. "Yellow gate opposite RCCG youth church, beside the mallam selling fruits"'}
        </Text>
        <Text style={styles.checkoutTitle}>Street or area</Text>
        <Input value={address} onChangeText={setAddress} />
        <View style={styles.paymentHeader}>
          <CreditCard size={22} color={colors.text} />
          <Text style={styles.checkoutTitleNoMargin}>Payment Method</Text>
        </View>
        <Card style={{ gap: spacing.lg }}>
          <View style={styles.paymentMethod}>
            <Banknote size={22} color={colors.text} />
            <View>
              <Text style={styles.paymentTitle}>Bank Transfer</Text>
              <Text style={styles.paymentSub}>Pay when the rider arrives</Text>
            </View>
          </View>
          <View style={styles.paymentMethod}>
            <QrCode size={22} color={colors.text} />
            <View>
              <Text style={styles.paymentTitle}>Scan Rider QR Code</Text>
              <Text style={styles.paymentSub}>Pay when the rider arrives</Text>
            </View>
          </View>
        </Card>
        <Text style={styles.helper}>Your payment is only made when your order arrives safely.</Text>
        <Card>
          <Text style={styles.orderSummaryTitle}>Order Summary</Text>
          <SummaryRow label="Subtotal" value={formatNaira(cartSubtotal)} />
          <SummaryRow label="Delivery fee" value={formatNaira(deliveryFee)} />
          <SummaryRow label="Pay on arrival" value={formatNaira(cartSubtotal + deliveryFee)} bold />
        </Card>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Place Order"
          disabled={!landmark.trim()}
          onPress={() => {
            const order = placeOrder(landmark, address);
            navigation.replace('OrderPlaced', { orderId: order.id });
          }}
        />
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryBold]}>{value}</Text>
    </View>
  );
}

export function BuyerOrderPlacedScreen({ navigation, route }: any) {
  const { orders } = useApp();
  const order = orders.find((item) => item.id === route.params?.orderId) ?? orders[0];

  return (
    <Screen>
      <View style={[styles.content, { flex: 1, justifyContent: 'center' }]}>
        <View style={styles.riderCircle}>
          <Bike size={52} color={colors.primary} />
        </View>
        <Text style={[commonStyles.title, { textAlign: 'center' }]}>Order Placed</Text>
        <Text style={[commonStyles.body, { textAlign: 'center', marginBottom: spacing.xl }]}>
          {"Your order is being sent to the vendor. You'll be notified as it progresses."}
        </Text>
        <Card>
          <Text style={styles.orderSummaryTitle}>Order Summary</Text>
          <SummaryRow label="Order Reference:" value={order.id} />
          <SummaryRow label="Est Delivery Time:" value="10-20 mins" />
          <SummaryRow label="Shipping Address" value={order.address} />
        </Card>
      </View>
      <View style={styles.footer}>
        <Button
          title="Track my Order"
          onPress={() => navigation.replace('Tracking', { orderId: order.id })}
        />
      </View>
    </Screen>
  );
}

export function BuyerTrackingScreen({ navigation, route }: any) {
  const { orders, updateOrderStatus } = useApp();
  const order = orders.find((item) => item.id === route.params?.orderId) ?? orders[0];
  const steps = [
    ['Order Received', 'placed'],
    ['Being Packed', 'packed'],
    ['With Rider', 'with-rider'],
    ['Delivered', 'delivered'],
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <OjaMap routeMode />
        <View style={styles.content}>
          <Card style={styles.trackingHead}>
            <View>
              <Text style={styles.orderSummaryTitle}>{order.id}</Text>
              <Text style={styles.paymentSub}>{order.shopName}</Text>
            </View>
            <StatusBadge status={order.status} />
          </Card>
          <Card style={{ gap: spacing.xl }}>
            <Text style={styles.checkoutTitleNoMargin}>Delivery Progress</Text>
            {steps.map(([label, step]) => {
              const active =
                step === 'placed' ||
                step === 'packed' ||
                step === order.status ||
                order.status === 'with-rider';
              return (
                <View key={step} style={styles.progressRow}>
                  <PackageCheck size={22} color={active ? colors.primary : colors.placeholder} />
                  <Text style={[styles.progressText, !active && { color: colors.placeholder }]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </Card>
          <Card style={styles.riderCard}>
            <View style={styles.riderMini}>
              <Bike size={24} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>Your Rider</Text>
              <Text style={styles.paymentSub}>Assigned and on the way</Text>
            </View>
            <Phone size={22} color={colors.text} />
          </Card>
          <Button
            title="Simulate Rider Arrived"
            variant="secondary"
            onPress={() => {
              updateOrderStatus(order.id, 'arrived');
              navigation.navigate('Payment', { orderId: order.id });
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

export function BuyerPaymentScreen({ navigation, route }: any) {
  const { orders, updateOrderStatus } = useApp();
  const order = orders.find((item) => item.id === route.params?.orderId) ?? orders[0];
  const [method, setMethod] = useState<'bank' | 'qr'>('bank');

  return (
    <Screen>
      <Header title="Make Payment" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.segment}>
          <Pressable
            onPress={() => setMethod('bank')}
            style={[styles.segmentButton, method === 'bank' && styles.segmentActive]}>
            <Banknote size={20} color={colors.text} />
            <Text style={styles.segmentText}>Bank Transfer</Text>
          </Pressable>
          <Pressable
            onPress={() => setMethod('qr')}
            style={[styles.segmentButton, method === 'qr' && styles.segmentActive]}>
            <QrCode size={20} color={colors.text} />
            <Text style={styles.segmentText}>Scan Rider QR</Text>
          </Pressable>
        </View>
        <Card style={{ gap: spacing.lg }}>
          {method === 'bank' ? (
            <>
              <SummaryRow label="Bank:" value="OPay" />
              <SummaryRow label="Account Number" value="7012345678" />
              <SummaryRow label="Account name" value="Oja Platform" />
              <SummaryRow
                label="Amount"
                value={formatNaira(order.subtotal + order.deliveryFee)}
                bold
              />
            </>
          ) : (
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <QrCode size={136} color={colors.text} />
              <Text style={styles.paymentSub}>Scan the rider QR to confirm this exact order.</Text>
            </View>
          )}
        </Card>
      </View>
      <View style={styles.footer}>
        <Button
          title="I've made Payment"
          onPress={() => {
            updateOrderStatus(order.id, 'paid');
            navigation.navigate('Tracking', { orderId: order.id });
          }}
        />
      </View>
    </Screen>
  );
}

export function BuyerHistoryScreen({ navigation }: any) {
  const { orders } = useApp();

  return (
    <Screen>
      <Header title="Order History" />
      <FlatList
        contentContainerStyle={styles.content}
        data={orders}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            icon={<History size={32} color={colors.primary} />}
            title="No orders yet"
            body="Your completed Oja orders will appear here."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Market', { screen: 'Tracking', params: { orderId: item.id } })
            }>
            <Card style={styles.historyCard}>
              <View>
                <Text style={styles.orderSummaryTitle}>{item.id}</Text>
                <Text style={styles.paymentSub}>{item.shopName}</Text>
              </View>
              <StatusBadge status={item.status} />
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

export function BuyerProfileScreen() {
  const { profile, resetDemo } = useApp();
  return (
    <Screen>
      <Header title="Profile" />
      <View style={styles.content}>
        <Card style={{ gap: spacing.md }}>
          <Text style={commonStyles.title}>{profile.name}</Text>
          <Text style={commonStyles.body}>{profile.phone}</Text>
          <Text style={commonStyles.body}>{profile.community}</Text>
        </Card>
        <Card style={styles.trustCard}>
          <CheckCircle2 size={24} color={colors.success} />
          <Text style={styles.trustText}>
            Pay on Delivery is active for all buyer orders in this demo.
          </Text>
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
  hero: {
    backgroundColor: '#FFF1F2',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: 144,
  },
  heroTop: {
    flexDirection: 'row',
    height: 60,
    backgroundColor:  "black",
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationText: {
    fontFamily: fonts.title,
    color: colors.text,
    fontSize: 16,
  },
  cartIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: 'center',
    overflow: 'hidden',
  },
  heroTitle: {
    marginTop: spacing.xl,
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 31,
    maxWidth: 320,
  },
  searchBox: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: -26,
    height: 52,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    ...shadow,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
  },
  categoryCard: {
    flex: 1,
    height: 90,
    borderRadius: 6,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryTitle: {
    fontFamily: fonts.medium,
    color: colors.text,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontFamily: fonts.medium,
  },
  shopGrid: {
    padding: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  shopCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xs,
  },
  shopImage: {
    height: 148,
    borderRadius: 12,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  shopHeroText: {
    color: colors.white,
    fontFamily: fonts.display,
    fontSize: 18,
    textAlign: 'center',
  },
  shopAwning: {
    color: colors.white,
    fontFamily: fonts.semi,
    fontSize: 10,
    textAlign: 'center',
  },
  shopName: {
    marginTop: spacing.md,
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 16,
  },
  shopEta: {
    marginTop: 6,
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  shopMeta: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: fonts.medium,
    color: colors.text,
  },
  storeHero: {
    height: 230,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
  storeSign: {
    alignSelf: 'center',
    color: colors.white,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 0,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  storeName: {
    color: colors.white,
    fontFamily: fonts.display,
    fontSize: 22,
    textAlign: 'center',
  },
  storeInfo: {
    color: colors.white,
    fontFamily: fonts.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  payLater: {
    color: colors.success,
    fontFamily: fonts.medium,
  },
  productGrid: {
    padding: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  productCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xs,
  },
  productImage: {
    height: 146,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: {
    fontSize: 78,
  },
  productAdd: {
    position: 'absolute',
    right: -2,
    bottom: 10,
    minWidth: 44,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadow,
  },
  productName: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 16,
  },
  productPrice: {
    marginTop: 6,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  quantity: {
    fontFamily: fonts.title,
    color: colors.text,
    fontSize: 15,
  },
  cartBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    height: 56,
    borderRadius: 6,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  cartBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryDark,
    color: colors.white,
    textAlign: 'center',
    fontFamily: fonts.medium,
    overflow: 'hidden',
  },
  cartBarText: {
    color: colors.white,
    fontFamily: fonts.semi,
    fontSize: 16,
  },
  detailImage: {
    height: 250,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailEmoji: {
    fontSize: 126,
  },
  detailPrice: {
    color: colors.primary,
    fontFamily: fonts.display,
    fontSize: 28,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trustText: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.medium,
    lineHeight: 21,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cartEmoji: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.surface,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 42,
    overflow: 'hidden',
  },
  counter: {
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: colors.secondary,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  totalValue: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 18,
  },
  helper: {
    color: colors.placeholder,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 19,
  },
  checkoutTitle: {
    marginTop: spacing.md,
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 17,
  },
  checkoutTitleNoMargin: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 17,
  },
  landmarkInput: {
    minHeight: 78,
    paddingTop: 14,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  paymentMethod: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  paymentTitle: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  paymentSub: {
    color: colors.placeholder,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 3,
  },
  orderSummaryTitle: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 17,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  summaryLabel: {
    flex: 1,
    color: colors.placeholder,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  summaryValue: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 15,
    textAlign: 'right',
  },
  summaryBold: {
    fontFamily: fonts.title,
    color: colors.text,
    fontSize: 17,
  },
  riderCircle: {
    alignSelf: 'center',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  trackingHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  progressText: {
    color: colors.primary,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  riderMini: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.softRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 6,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    color: colors.text,
    fontFamily: fonts.medium,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
