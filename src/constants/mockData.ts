export type Role = 'buyer' | 'vendor' | 'rider';
export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'packed'
  | 'with-rider'
  | 'arrived'
  | 'paid'
  | 'delivered';

export type Product = {
  id: string;
  shopId: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  emoji: string;
  inStock: boolean;
  description: string;
};

export type Shop = {
  id: string;
  name: string;
  category: string;
  distance: string;
  eta: string;
  rating: number;
  landmark: string;
  hero: string;
  accent: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  shopId: string;
  shopName: string;
  items: CartItem[];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  address: string;
  landmark: string;
  buyerName: string;
  riderName: string;
  riderPhone: string;
  createdAt: string;
};

export const categories = [
  { id: 'drinks', title: 'Drinks', emoji: '🥤' },
  { id: 'food', title: 'Food', emoji: '🍲' },
  { id: 'groceries', title: 'Groceries', emoji: '🛍️' },
  { id: 'more', title: 'More', emoji: '▦' },
];

export const shops: Shop[] = [
  {
    id: 'iya-risi',
    name: 'Iya Risi Canteen',
    category: 'Food Canteen',
    distance: '0.4km',
    eta: '6-12 mins',
    rating: 4.8,
    landmark: 'Beside Youth Centre, Redemption City',
    hero: 'IYA RISI FOOD CANTEEN',
    accent: '#166534',
  },
  {
    id: 'omo-igbo',
    name: 'Omo Igbo Store',
    category: 'Grocery Store',
    distance: '0.7km',
    eta: '10-15 mins',
    rating: 4.8,
    landmark: 'Opposite Jubilee Gate',
    hero: 'NAIJA GOODNESS GROCERY',
    accent: '#92400E',
  },
  {
    id: 'fatima-fruit',
    name: 'Iya Fatima Fruit Stand',
    category: 'Fresh Produce',
    distance: '1.1km',
    eta: '12-18 mins',
    rating: 4.7,
    landmark: 'Near Old Auditorium Road',
    hero: 'IYA FATIMA FRUIT STAND',
    accent: '#15803D',
  },
  {
    id: 'olayinka-frozen',
    name: 'Olayinka Frozen Food',
    category: 'Frozen Food',
    distance: '1.4km',
    eta: '15-20 mins',
    rating: 4.6,
    landmark: 'Behind Manna Prayer Mountain',
    hero: 'OLAYINKA FROZEN FOOD',
    accent: '#1D4ED8',
  },
];

export const products: Product[] = [
  {
    id: 'jollof',
    shopId: 'iya-risi',
    name: 'Smoky jollof',
    category: 'food',
    price: 4000,
    unit: '1 plate',
    emoji: '🍛',
    inStock: true,
    description: 'Party-style smoky jollof rice with fried turkey and plantain.',
  },
  {
    id: 'fufu-egusi',
    shopId: 'iya-risi',
    name: 'Fufu & Egusi',
    category: 'food',
    price: 4000,
    unit: '1 wrap',
    emoji: '🥣',
    inStock: true,
    description: 'Soft fufu with rich egusi soup and assorted meat.',
  },
  {
    id: 'wings',
    shopId: 'iya-risi',
    name: 'Peppered chicken',
    category: 'food',
    price: 3200,
    unit: 'pack',
    emoji: '🍗',
    inStock: true,
    description: 'Spicy fried chicken for quick lunch or family dinner.',
  },
  {
    id: 'pasta',
    shopId: 'iya-risi',
    name: 'Creamy pasta',
    category: 'food',
    price: 3500,
    unit: 'bowl',
    emoji: '🍝',
    inStock: true,
    description: 'Creamy pasta with vegetables and grilled chicken strips.',
  },
  {
    id: 'rice-bag',
    shopId: 'omo-igbo',
    name: 'Mama Gold rice',
    category: 'groceries',
    price: 6200,
    unit: '5kg',
    emoji: '🍚',
    inStock: true,
    description: 'Clean local rice, bagged for family cooking.',
  },
  {
    id: 'groundnut-oil',
    shopId: 'omo-igbo',
    name: 'Groundnut oil',
    category: 'groceries',
    price: 2900,
    unit: '1L',
    emoji: '🛢️',
    inStock: true,
    description: 'Fresh cooking oil sealed in a one litre bottle.',
  },
  {
    id: 'malt',
    shopId: 'omo-igbo',
    name: 'Malt drink pack',
    category: 'drinks',
    price: 3400,
    unit: '6 bottles',
    emoji: '🥤',
    inStock: true,
    description: 'Cold malt drinks for guests, office, or church meetings.',
  },
  {
    id: 'plantain',
    shopId: 'fatima-fruit',
    name: 'Ripe plantain',
    category: 'groceries',
    price: 1800,
    unit: 'bunch',
    emoji: '🍌',
    inStock: true,
    description: 'Sweet ripe plantain from the morning market run.',
  },
  {
    id: 'frozen-chicken',
    shopId: 'olayinka-frozen',
    name: 'Frozen chicken',
    category: 'groceries',
    price: 5600,
    unit: '1kg',
    emoji: '🍗',
    inStock: true,
    description: 'Clean frozen chicken cuts, packed with ice.',
  },
];

export const existingOrders: Order[] = [
  {
    id: 'OJA-2026-0041',
    shopId: 'iya-risi',
    shopName: 'Iya Risi Canteen',
    items: [{ product: products[0], quantity: 1 }],
    status: 'with-rider',
    subtotal: 4000,
    deliveryFee: 550,
    address: 'Salisu Street',
    landmark: 'Yellow gate opposite RCCG youth church, beside the mallam selling fruits',
    buyerName: 'Tunde O.',
    riderName: 'Tunde O.',
    riderPhone: '0812 220 0011',
    createdAt: new Date().toISOString(),
  },
];

export const formatNaira = (value: number) => `₦${value.toLocaleString('en-NG')}`;
