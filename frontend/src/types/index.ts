export interface Doll {
  id: string;
  name: string;
  price: number;
  material: string;
  size: string;
  stock: number;
  status: 'active' | 'inactive';
  isHot: boolean;
  series: string;
  patentNo: string;
  images: string[];
  description: string;
  createdAt: string;
  views: number;
  inquiries: number;
  lowStockThreshold: number;
  minQuantity: number;
  defaultAccessory?: string;
  selectedAccessories?: { id: string; name: string; price: number; images?: string[]; series?: string }[];
  smallBoxCapacity?: number;
  mediumBoxCapacity?: number;
  largeBoxCapacity?: number;
}

export interface Accessory {
  id: string;
  name: string;
  category: 'headwear' | 'clothing' | 'shoes' | 'props' | 'giftbox';
  series: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  isHot: boolean;
  material: string;
  images: string[];
  description: string;
  applicableDolls: string[];
  createdAt: string;
  views: number;
  lowStockThreshold: number;
}

export interface SeriesItem {
  id: string;
  name: string;
  description: string;
  type: 'doll' | 'accessory' | 'both';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  value: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface InquiryItem {
  type: 'doll' | 'accessory' | 'outfit';
  id: string;
  name: string;
  price: number;
}

export interface InquiryOrder {
  id: string;
  orderNo: string;
  userId: string;
  userName: string;
  userPhone: string;
  address?: string;
  items: InquiryItem[];
  totalAmount: number;
  status: 'pending' | 'contacted' | 'quoted' | 'closed' | 'cancelled';
  remark?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  isPindan?: boolean;
  followUpRecords: { id: string; time: string; status: string; operator: string; note: string }[];
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  status: 'active' | 'disabled';
  region: string;
  registerIp: string;
  createdAt: string;
  inquiryCount: number;
  lastActive: string;
}

export interface OutfitTemplate {
  id: string;
  name: string;
  dollId: string;
  dollName: string;
  dollSeries?: string;
  accessories: { id: string; name: string; price: number }[];
  totalPrice: number;
  coverImage: string;
  isHot: boolean;
  createdAt: string;
  usageCount: number;
}

export interface InventoryRecord {
  id: string;
  productType: 'doll' | 'accessory';
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  operator: string;
  createdAt: string;
  balanceBefore: number;
  balanceAfter: number;
}

export interface SystemLog {
  id: string;
  action: string;
  operator: string;
  ip: string;
  detail: string;
  createdAt: string;
}

export interface Admin {
  id: string;
  username: string;
  role: 'super' | 'manager' | 'staff';
  email: string;
  lastLogin: string;
  status: 'active' | 'disabled';
}

export interface MiniUserRegister {
  id: string;
  openid: string;
  nickname: string;
  avatar: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CompanyInfo {
  name: string;
  slogan: string;
  phone: string;
  address: string;
  workHours: string;
  email: string;
  description: string;
  mapLng: string;
  mapLat: string;
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link?: string;
  linkType?: 'doll' | 'accessory' | 'outfit' | 'article' | '';
  linkId?: string;
  sort: number;
  status: 'active' | 'inactive';
}
