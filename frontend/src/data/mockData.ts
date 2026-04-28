import type { Doll, Accessory, InquiryOrder, User, OutfitTemplate, InventoryRecord, Admin, SeriesItem, CategoryItem } from '../types';

export const mockSeries: SeriesItem[] = [
  { id: 's001', name: '花园系列', description: '以自然花卉为主题，色彩柔和', type: 'doll', status: 'active', createdAt: '2024-01-01' },
  { id: 's002', name: '萌宠系列', description: '可爱动物造型，深受儿童喜爱', type: 'doll', status: 'active', createdAt: '2024-01-01' },
  { id: 's003', name: '梦幻系列', description: '梦幻童话风格设计', type: 'doll', status: 'active', createdAt: '2024-01-01' },
  { id: 's004', name: '经典系列', description: '经典复古风格，收藏价值高', type: 'doll', status: 'active', createdAt: '2024-01-01' },
  { id: 's005', name: '童话系列', description: '童话故事主题系列', type: 'doll', status: 'active', createdAt: '2024-01-01' },
  { id: 's006', name: '特效系列', description: '特殊材料制作，具有特殊效果', type: 'doll', status: 'inactive', createdAt: '2024-01-01' },
  { id: 's007', name: '宫廷系列', description: '以宫廷风格为主题的配饰系列', type: 'accessory', status: 'active', createdAt: '2024-02-01' },
  { id: 's008', name: '国风系列', description: '中国传统风格配饰', type: 'accessory', status: 'active', createdAt: '2024-02-01' },
  { id: 's009', name: '基础系列', description: '百搭基础款配饰', type: 'both', status: 'active', createdAt: '2024-01-01' },
];

export const mockCategories: CategoryItem[] = [
  { id: 'c001', name: '头饰', value: 'headwear', description: '发箍、发夹、帽子等头部配饰', status: 'active', createdAt: '2024-01-01' },
  { id: 'c002', name: '衣服', value: 'clothing', description: '各类服装套装', status: 'active', createdAt: '2024-01-01' },
  { id: 'c003', name: '鞋子', value: 'shoes', description: '各类鞋款', status: 'active', createdAt: '2024-01-01' },
  { id: 'c004', name: '道具', value: 'props', description: '手持道具、装饰品', status: 'active', createdAt: '2024-01-01' },
  { id: 'c005', name: '礼盒包装', value: 'giftbox', description: '礼品包装盒', status: 'active', createdAt: '2024-01-01' },
];

export const mockDolls: Doll[] = [
  {
    id: 'd001', name: '樱花精灵', price: 299, material: '优质棉麻布料', size: '45cm',
    stock: 48, status: 'active', series: '花园系列', patentNo: 'ZL202310001234',
    images: [
      'https://images.pexels.com/photos/3661261/pexels-photo-3661261.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3661262/pexels-photo-3661262.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '樱花精灵布娃娃，采用优质棉麻布料，手工缝制，细节精致，是送礼佳品。',
    createdAt: '2024-01-15', views: 1256, inquiries: 89, lowStockThreshold: 10,
  },
  {
    id: 'd002', name: '蓝眼猫咪', price: 189, material: '超柔绒布', size: '30cm',
    stock: 72, status: 'active', series: '萌宠系列', patentNo: 'ZL202310002345',
    images: [
      'https://images.pexels.com/photos/1458916/pexels-photo-1458916.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '蓝眼猫咪布偶，超柔绒布材质，蓬松柔软，深受儿童喜爱。',
    createdAt: '2024-02-10', views: 987, inquiries: 65, lowStockThreshold: 10,
  },
  {
    id: 'd003', name: '月光兔兔', price: 259, material: '进口pp棉填充', size: '40cm',
    stock: 8, status: 'active', series: '梦幻系列', patentNo: 'ZL202310003456',
    images: [
      'https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '月光兔兔布娃娃，进口pp棉填充，手感舒适，安全无毒。',
    createdAt: '2024-03-05', views: 2103, inquiries: 156, lowStockThreshold: 10,
  },
  {
    id: 'd004', name: '复古熊先生', price: 359, material: '高级毛绒面料', size: '50cm',
    stock: 34, status: 'active', series: '经典系列', patentNo: 'ZL202310004567',
    images: [
      'https://images.pexels.com/photos/3661264/pexels-photo-3661264.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '复古熊先生，高级毛绒面料，复古风格设计，收藏价值极高。',
    createdAt: '2024-01-28', views: 756, inquiries: 43, lowStockThreshold: 10,
  },
  {
    id: 'd005', name: '彩虹小马', price: 219, material: '羊毛绒', size: '35cm',
    stock: 6, status: 'active', series: '童话系列', patentNo: 'ZL202310005678',
    images: [
      'https://images.pexels.com/photos/1148998/pexels-photo-1148998.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '彩虹小马布偶，羊毛绒材质，色彩鲜艳，深受小朋友喜爱。',
    createdAt: '2024-04-12', views: 1432, inquiries: 112, lowStockThreshold: 10,
  },
  {
    id: 'd006', name: '夜光星星熊', price: 399, material: '夜光特殊材料+棉麻', size: '45cm',
    stock: 21, status: 'inactive', series: '特效系列', patentNo: 'ZL202310006789',
    images: [
      'https://images.pexels.com/photos/3661265/pexels-photo-3661265.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '夜光星星熊，特殊夜光材料制作，夜间可发出柔和光芒。',
    createdAt: '2024-05-01', views: 543, inquiries: 28, lowStockThreshold: 10,
  },
];

export const mockAccessories: Accessory[] = [
  {
    id: 'a001', name: '蕾丝头饰', category: 'headwear', series: '宫廷系列', price: 29, stock: 150,
    status: 'active', material: '蕾丝+金属', images: [
      'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '精致蕾丝头饰，适合多款娃娃。', applicableDolls: ['d001', 'd003'],
    createdAt: '2024-01-20', views: 432, lowStockThreshold: 20,
  },
  {
    id: 'a002', name: '公主礼服', category: 'clothing', series: '宫廷系列', price: 89, stock: 85,
    status: 'active', material: '涤纶+蕾丝', images: [
      'https://images.pexels.com/photos/1148999/pexels-photo-1148999.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '精美公主礼服，手工缝制，细节精致。', applicableDolls: ['d001', 'd004'],
    createdAt: '2024-01-22', views: 678, lowStockThreshold: 15,
  },
  {
    id: 'a003', name: '水晶鞋', category: 'shoes', series: '基础系列', price: 39, stock: 12,
    status: 'active', material: '亚克力+布料', images: [
      'https://images.pexels.com/photos/338946/pexels-photo-338946.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '水晶鞋款式精美，适合各类娃娃。', applicableDolls: ['d001', 'd002', 'd003'],
    createdAt: '2024-02-01', views: 345, lowStockThreshold: 20,
  },
  {
    id: 'a004', name: '魔法棒', category: 'props', series: '宫廷系列', price: 49, stock: 67,
    status: 'active', material: '金属+亮片', images: [
      'https://images.pexels.com/photos/1191532/pexels-photo-1191532.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '闪亮魔法棒，搭配公主系列娃娃使用。', applicableDolls: ['d001', 'd003'],
    createdAt: '2024-02-15', views: 234, lowStockThreshold: 10,
  },
  {
    id: 'a005', name: '礼盒包装', category: 'giftbox', series: '基础系列', price: 59, stock: 200,
    status: 'active', material: '硬纸板+丝绸', images: [
      'https://images.pexels.com/photos/1340502/pexels-photo-1340502.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '高档礼盒包装，适合各类娃娃。', applicableDolls: ['d001', 'd002', 'd003', 'd004', 'd005'],
    createdAt: '2024-01-10', views: 567, lowStockThreshold: 30,
  },
  {
    id: 'a006', name: '汉服套装', category: 'clothing', series: '国风系列', price: 129, stock: 43,
    status: 'active', material: '真丝+刺绣', images: [
      'https://images.pexels.com/photos/1148997/pexels-photo-1148997.jpeg?auto=compress&cs=tinysrgb&w=400',
    ],
    description: '精美汉服套装，刺绣工艺，国潮风格。', applicableDolls: ['d001', 'd004'],
    createdAt: '2024-03-10', views: 789, lowStockThreshold: 10,
  },
];

export const mockInquiries: InquiryOrder[] = [
  {
    id: 'i001', orderNo: 'INQ20240601001', userId: 'u001', userName: '张小花',
    userPhone: '13800138001', address: '广东省广州市天河区XX街道123号',
    items: [{
      dollId: 'd001', dollName: '樱花精灵', dollPrice: 299,
      accessories: [
        { id: 'a001', name: '蕾丝头饰', price: 29 },
        { id: 'a002', name: '公主礼服', price: 89 },
      ],
      totalPrice: 417,
    }],
    totalAmount: 417, status: 'pending',
    remark: '希望可以定制颜色，最好是粉色系',
    createdAt: '2024-06-01 14:23:00', updatedAt: '2024-06-01 14:23:00',
    followUpRecords: [],
  },
  {
    id: 'i002', orderNo: 'INQ20240601002', userId: 'u002', userName: '李美丽',
    userPhone: '13900139002', address: '上海市浦东新区XX路456号',
    items: [{
      dollId: 'd002', dollName: '蓝眼猫咪', dollPrice: 189,
      accessories: [{ id: 'a005', name: '礼盒包装', price: 59 }],
      totalPrice: 248,
    }],
    totalAmount: 248, status: 'quoted',
    remark: '送礼用，需要精美包装',
    adminNote: '已报价，等待客户确认',
    createdAt: '2024-06-01 16:45:00', updatedAt: '2024-06-02 09:30:00',
    followUpRecords: [],
  },
  {
    id: 'i003', orderNo: 'INQ20240602001', userId: 'u003', userName: '王大宝',
    userPhone: '15000150003',
    items: [{
      dollId: 'd003', dollName: '月光兔兔', dollPrice: 259,
      accessories: [
        { id: 'a001', name: '蕾丝头饰', price: 29 },
        { id: 'a004', name: '魔法棒', price: 49 },
        { id: 'a005', name: '礼盒包装', price: 59 },
      ],
      totalPrice: 396,
    }],
    totalAmount: 396, status: 'contacted',
    createdAt: '2024-06-02 10:12:00', updatedAt: '2024-06-02 11:00:00',
    followUpRecords: [],
  },
  {
    id: 'i004', orderNo: 'INQ20240602002', userId: 'u004', userName: '陈小明',
    userPhone: '18600186004', address: '北京市朝阳区XX大道789号',
    items: [{
      dollId: 'd004', dollName: '复古熊先生', dollPrice: 359,
      accessories: [
        { id: 'a002', name: '公主礼服', price: 89 },
        { id: 'a006', name: '汉服套装', price: 129 },
      ],
      totalPrice: 577,
    }],
    totalAmount: 577, status: 'closed',
    remark: '批量采购20套，询价',
    adminNote: '成交，已安排生产',
    createdAt: '2024-06-02 15:33:00', updatedAt: '2024-06-03 10:00:00',
    followUpRecords: [],
  },
  {
    id: 'i005', orderNo: 'INQ20240603001', userId: 'u005', userName: '刘晓红',
    userPhone: '13700137005',
    items: [{
      dollId: 'd005', dollName: '彩虹小马', dollPrice: 219,
      accessories: [{ id: 'a003', name: '水晶鞋', price: 39 }],
      totalPrice: 258,
    }],
    totalAmount: 258, status: 'cancelled',
    remark: '想了解最小起订量',
    createdAt: '2024-06-03 09:00:00', updatedAt: '2024-06-03 14:00:00',
    followUpRecords: [],
  },
  {
    id: 'i006', orderNo: 'INQ20240603002', userId: 'u006', userName: '赵天天',
    userPhone: '18900189006',
    items: [{
      dollId: 'd001', dollName: '樱花精灵', dollPrice: 299,
      accessories: [
        { id: 'a006', name: '汉服套装', price: 129 },
        { id: 'a005', name: '礼盒包装', price: 59 },
      ],
      totalPrice: 487,
    }],
    totalAmount: 487, status: 'pending',
    remark: '节日礼品批量定制，数量50套',
    createdAt: '2024-06-03 16:20:00', updatedAt: '2024-06-03 16:20:00',
    followUpRecords: [],
  },
];

export const mockUsers: User[] = [
  { id: 'u001', phone: '13800138001', nickname: '张小花', status: 'active', region: '广东广州', registerIp: '120.234.12.45', createdAt: '2024-03-15', inquiryCount: 5, lastActive: '2024-06-01' },
  { id: 'u002', phone: '13900139002', nickname: '李美丽', status: 'active', region: '上海', registerIp: '101.88.67.23', createdAt: '2024-04-02', inquiryCount: 3, lastActive: '2024-06-01' },
  { id: 'u003', phone: '15000150003', nickname: '王大宝', status: 'active', region: '浙江杭州', registerIp: '112.45.67.89', createdAt: '2024-04-18', inquiryCount: 7, lastActive: '2024-06-02' },
  { id: 'u004', phone: '18600186004', nickname: '陈小明', status: 'active', region: '北京', registerIp: '59.156.78.90', createdAt: '2024-05-01', inquiryCount: 12, lastActive: '2024-06-02' },
  { id: 'u005', phone: '13700137005', nickname: '刘晓红', status: 'disabled', region: '四川成都', registerIp: '116.23.45.67', createdAt: '2024-05-10', inquiryCount: 2, lastActive: '2024-06-03' },
  { id: 'u006', phone: '18900189006', nickname: '赵天天', status: 'active', region: '江苏南京', registerIp: '180.97.45.23', createdAt: '2024-05-20', inquiryCount: 8, lastActive: '2024-06-03' },
  { id: 'u007', phone: '13600136007', nickname: '孙小龙', status: 'active', region: '湖北武汉', registerIp: '218.45.67.89', createdAt: '2024-05-25', inquiryCount: 1, lastActive: '2024-05-30' },
  { id: 'u008', phone: '15100151008', nickname: '周小丽', status: 'active', region: '陕西西安', registerIp: '117.131.45.67', createdAt: '2024-06-01', inquiryCount: 0, lastActive: '2024-06-01' },
];

export const mockOutfitTemplates: OutfitTemplate[] = [
  {
    id: 'ot001', name: '公主礼服全套', dollId: 'd001', dollName: '樱花精灵',
    accessories: [
      { id: 'a001', name: '蕾丝头饰', price: 29 },
      { id: 'a002', name: '公主礼服', price: 89 },
      { id: 'a003', name: '水晶鞋', price: 39 },
    ],
    totalPrice: 456, coverImage: 'https://images.pexels.com/photos/3661261/pexels-photo-3661261.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: true, createdAt: '2024-03-01', usageCount: 234,
  },
  {
    id: 'ot002', name: '国风汉服礼盒', dollId: 'd004', dollName: '复古熊先生',
    accessories: [
      { id: 'a006', name: '汉服套装', price: 129 },
      { id: 'a005', name: '礼盒包装', price: 59 },
    ],
    totalPrice: 547, coverImage: 'https://images.pexels.com/photos/3661264/pexels-photo-3661264.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: true, createdAt: '2024-03-15', usageCount: 189,
  },
  {
    id: 'ot003', name: '萌宠基础款', dollId: 'd002', dollName: '蓝眼猫咪',
    accessories: [
      { id: 'a005', name: '礼盒包装', price: 59 },
    ],
    totalPrice: 248, coverImage: 'https://images.pexels.com/photos/1458916/pexels-photo-1458916.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: false, createdAt: '2024-04-01', usageCount: 67,
  },
];

export const mockInventoryRecords: InventoryRecord[] = [
  { id: 'ir001', productType: 'doll', productId: 'd001', productName: '樱花精灵', type: 'in', quantity: 50, reason: '生产入库', operator: 'admin', createdAt: '2024-05-01', balanceBefore: 0, balanceAfter: 50 },
  { id: 'ir002', productType: 'doll', productId: 'd001', productName: '樱花精灵', type: 'out', quantity: 2, reason: '订单出库', operator: 'staff01', createdAt: '2024-05-15', balanceBefore: 50, balanceAfter: 48 },
  { id: 'ir003', productType: 'accessory', productId: 'a002', productName: '公主礼服', type: 'in', quantity: 100, reason: '采购入库', operator: 'admin', createdAt: '2024-05-10', balanceBefore: 0, balanceAfter: 100 },
  { id: 'ir004', productType: 'accessory', productId: 'a002', productName: '公主礼服', type: 'out', quantity: 15, reason: '订单出库', operator: 'staff01', createdAt: '2024-05-20', balanceBefore: 100, balanceAfter: 85 },
  { id: 'ir005', productType: 'doll', productId: 'd003', productName: '月光兔兔', type: 'in', quantity: 30, reason: '生产入库', operator: 'admin', createdAt: '2024-05-05', balanceBefore: 0, balanceAfter: 30 },
  { id: 'ir006', productType: 'doll', productId: 'd003', productName: '月光兔兔', type: 'out', quantity: 22, reason: '订单出库', operator: 'staff02', createdAt: '2024-05-28', balanceBefore: 30, balanceAfter: 8 },
  { id: 'ir007', productType: 'accessory', productId: 'a003', productName: '水晶鞋', type: 'in', quantity: 50, reason: '采购入库', operator: 'admin', createdAt: '2024-05-12', balanceBefore: 0, balanceAfter: 50 },
  { id: 'ir008', productType: 'accessory', productId: 'a003', productName: '水晶鞋', type: 'out', quantity: 38, reason: '订单出库 + 损耗', operator: 'staff01', createdAt: '2024-05-30', balanceBefore: 50, balanceAfter: 12 },
];

export const mockAdmins: Admin[] = [
  { id: 'adm001', username: 'admin', role: 'super', email: 'admin@dollfactory.com', lastLogin: '2024-06-03 08:00:00', status: 'active' },
  { id: 'adm002', username: 'manager01', role: 'manager', email: 'manager@dollfactory.com', lastLogin: '2024-06-02 17:30:00', status: 'active' },
  { id: 'adm003', username: 'staff01', role: 'staff', email: 'staff01@dollfactory.com', lastLogin: '2024-06-03 09:00:00', status: 'active' },
  { id: 'adm004', username: 'staff02', role: 'staff', email: 'staff02@dollfactory.com', lastLogin: '2024-05-30 16:00:00', status: 'disabled' },
];

export const chartData = {
  dailyInquiries: [
    { date: '5/28', count: 8, amount: 3240 },
    { date: '5/29', count: 12, amount: 4890 },
    { date: '5/30', count: 9, amount: 3670 },
    { date: '5/31', count: 15, amount: 6120 },
    { date: '6/1', count: 18, amount: 7340 },
    { date: '6/2', count: 14, amount: 5690 },
    { date: '6/3', count: 21, amount: 8560 },
  ],
  userRegistrations: [
    { month: '1月', count: 45 },
    { month: '2月', count: 67 },
    { month: '3月', count: 89 },
    { month: '4月', count: 123 },
    { month: '5月', count: 156 },
    { month: '6月', count: 78 },
  ],
  regionData: [
    { region: '广东', count: 234 },
    { region: '上海', count: 189 },
    { region: '北京', count: 167 },
    { region: '浙江', count: 145 },
    { region: '江苏', count: 123 },
    { region: '四川', count: 98 },
    { region: '湖北', count: 87 },
    { region: '陕西', count: 65 },
  ],
  dollViews: [
    { name: '月光兔兔', views: 2103 },
    { name: '樱花精灵', views: 1256 },
    { name: '彩虹小马', views: 1432 },
    { name: '复古熊先生', views: 756 },
    { name: '蓝眼猫咪', views: 987 },
    { name: '夜光星星熊', views: 543 },
  ],
  accessoryUsage: [
    { name: '礼盒包装', count: 456 },
    { name: '公主礼服', count: 312 },
    { name: '蕾丝头饰', count: 287 },
    { name: '汉服套装', count: 234 },
    { name: '魔法棒', count: 189 },
    { name: '水晶鞋', count: 156 },
  ],
};
