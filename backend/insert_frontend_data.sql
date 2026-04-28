-- =============================================
-- 从前端项目提取的数据插入脚本
-- =============================================

USE hailiang_doll;

-- =============================================
-- 插入娃娃数据 (6条)
-- =============================================
INSERT INTO doll (id, name, price, material, size, stock, status, series, patent_no, description, images, views, inquiries, low_stock_threshold, created_at) VALUES
('d001', '樱花精灵', 299.00, '优质棉麻布料', '45cm', 48, 'active', '花园系列', 'ZL202310001234', '樱花精灵布娃娃，采用优质棉麻布料，手工缝制，细节精致，是送礼佳品。', '["https://images.pexels.com/photos/3661261/pexels-photo-3661261.jpeg?auto=compress&cs=tinysrgb&w=400", "https://images.pexels.com/photos/3661262/pexels-photo-3661262.jpeg?auto=compress&cs=tinysrgb&w=400"]', 1256, 89, 10, '2024-01-15'),
('d002', '蓝眼猫咪', 189.00, '超柔绒布', '30cm', 72, 'active', '萌宠系列', 'ZL202310002345', '蓝眼猫咪布偶，超柔绒布材质，蓬松柔软，深受儿童喜爱。', '["https://images.pexels.com/photos/1458916/pexels-photo-1458916.jpeg?auto=compress&cs=tinysrgb&w=400"]', 987, 65, 10, '2024-02-10'),
('d003', '月光兔兔', 259.00, '进口pp棉填充', '40cm', 8, 'active', '梦幻系列', 'ZL202310003456', '月光兔兔布娃娃，进口pp棉填充，手感舒适，安全无毒。', '["https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=400"]', 2103, 156, 10, '2024-03-05'),
('d004', '复古熊先生', 359.00, '高级毛绒面料', '50cm', 34, 'active', '经典系列', 'ZL202310004567', '复古熊先生，高级毛绒面料，复古风格设计，收藏价值极高。', '["https://images.pexels.com/photos/3661264/pexels-photo-3661264.jpeg?auto=compress&cs=tinysrgb&w=400"]', 756, 43, 10, '2024-01-28'),
('d005', '彩虹小马', 219.00, '羊毛绒', '35cm', 6, 'active', '童话系列', 'ZL202310005678', '彩虹小马布偶，羊毛绒材质，色彩鲜艳，深受小朋友喜爱。', '["https://images.pexels.com/photos/1148998/pexels-photo-1148998.jpeg?auto=compress&cs=tinysrgb&w=400"]', 1432, 112, 10, '2024-04-12'),
('d006', '夜光星星熊', 399.00, '夜光特殊材料+棉麻', '45cm', 21, 'inactive', '特效系列', 'ZL202310006789', '夜光星星熊，特殊夜光材料制作，夜间可发出柔和光芒。', '["https://images.pexels.com/photos/3661265/pexels-photo-3661265.jpeg?auto=compress&cs=tinysrgb&w=400"]', 543, 28, 10, '2024-05-01');

-- =============================================
-- 插入配饰数据 (6条)
-- =============================================
INSERT INTO accessory (id, name, category, price, stock, status, material, description, images, applicable_dolls, views, low_stock_threshold, created_at) VALUES
('a001', '蕾丝头饰', 'headwear', 29.00, 150, 'active', '蕾丝+金属', '精致蕾丝头饰，适合多款娃娃。', '["https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400"]', '["d001", "d003"]', 432, 20, '2024-01-20'),
('a002', '公主礼服', 'clothing', 89.00, 85, 'active', '涤纶+蕾丝', '精美公主礼服，手工缝制，细节精致。', '["https://images.pexels.com/photos/1148999/pexels-photo-1148999.jpeg?auto=compress&cs=tinysrgb&w=400"]', '["d001", "d004"]', 678, 15, '2024-01-22'),
('a003', '水晶鞋', 'shoes', 39.00, 12, 'active', '亚克力+布料', '水晶鞋款式精美，适合各类娃娃。', '["https://images.pexels.com/photos/338946/pexels-photo-338946.jpeg?auto=compress&cs=tinysrgb&w=400"]', '["d001", "d002", "d003"]', 345, 20, '2024-02-01'),
('a004', '魔法棒', 'props', 49.00, 67, 'active', '金属+亮片', '闪亮魔法棒，搭配公主系列娃娃使用。', '["https://images.pexels.com/photos/1191532/pexels-photo-1191532.jpeg?auto=compress&cs=tinysrgb&w=400"]', '["d001", "d003"]', 234, 10, '2024-02-15'),
('a005', '礼盒包装', 'giftbox', 59.00, 200, 'active', '硬纸板+丝绸', '高档礼盒包装，适合各类娃娃。', '["https://images.pexels.com/photos/1340502/pexels-photo-1340502.jpeg?auto=compress&cs=tinysrgb&w=400"]', '["d001", "d002", "d003", "d004", "d005"]', 567, 30, '2024-01-10'),
('a006', '汉服套装', 'clothing', 129.00, 43, 'active', '真丝+刺绣', '精美汉服套装，刺绣工艺，国潮风格。', '["https://images.pexels.com/photos/1148997/pexels-photo-1148997.jpeg?auto=compress&cs=tinysrgb&w=400"]', '["d001", "d004"]', 789, 10, '2024-03-10');

-- =============================================
-- 插入用户数据 (8条)
-- =============================================
INSERT INTO user (id, phone, password, nickname, status, region, register_ip, inquiry_count, last_active, created_at) VALUES
('u001', '13800138001', MD5('123456'), '张小花', 'active', '广东广州', '120.234.12.45', 5, '2024-06-01', '2024-03-15'),
('u002', '13900139002', MD5('123456'), '李美丽', 'active', '上海', '101.88.67.23', 3, '2024-06-01', '2024-04-02'),
('u003', '15000150003', MD5('123456'), '王大宝', 'active', '浙江杭州', '112.45.67.89', 7, '2024-06-02', '2024-04-18'),
('u004', '18600186004', MD5('123456'), '陈小明', 'active', '北京', '59.156.78.90', 12, '2024-06-02', '2024-05-01'),
('u005', '13700137005', MD5('123456'), '刘晓红', 'disabled', '四川成都', '116.23.45.67', 2, '2024-06-03', '2024-05-10'),
('u006', '18900189006', MD5('123456'), '赵天天', 'active', '江苏南京', '180.97.45.23', 8, '2024-06-03', '2024-05-20'),
('u007', '13600136007', MD5('123456'), '孙小龙', 'active', '湖北武汉', '218.45.67.89', 1, '2024-05-30', '2024-05-25'),
('u008', '15100151008', MD5('123456'), '周小丽', 'active', '陕西西安', '117.131.45.67', 0, '2024-06-01', '2024-06-01');

-- =============================================
-- 插入管理员数据 (2条，adm001和adm002已在init.sql中)
-- =============================================
INSERT INTO admin (id, username, password, role, email, last_login, status) VALUES
('adm003', 'staff01', MD5('staff123'), 'staff', 'staff01@dollfactory.com', '2024-06-03 09:00:00', 'active'),
('adm004', 'staff02', MD5('staff123'), 'staff', 'staff02@dollfactory.com', '2024-05-30 16:00:00', 'disabled');

-- =============================================
-- 插入搭配方案数据 (3条)
-- =============================================
INSERT INTO outfit_template (id, name, doll_id, doll_name, accessories, total_price, cover_image, is_hot, usage_count, created_at) VALUES
('ot001', '公主礼服全套', 'd001', '樱花精灵', '[{"id": "a001", "name": "蕾丝头饰", "price": 29}, {"id": "a002", "name": "公主礼服", "price": 89}, {"id": "a003", "name": "水晶鞋", "price": 39}]', 456.00, 'https://images.pexels.com/photos/3661261/pexels-photo-3661261.jpeg?auto=compress&cs=tinysrgb&w=400', 1, 234, '2024-03-01'),
('ot002', '国风汉服礼盒', 'd004', '复古熊先生', '[{"id": "a006", "name": "汉服套装", "price": 129}, {"id": "a005", "name": "礼盒包装", "price": 59}]', 547.00, 'https://images.pexels.com/photos/3661264/pexels-photo-3661264.jpeg?auto=compress&cs=tinysrgb&w=400', 1, 189, '2024-03-15'),
('ot003', '萌宠基础款', 'd002', '蓝眼猫咪', '[{"id": "a005", "name": "礼盒包装", "price": 59}]', 248.00, 'https://images.pexels.com/photos/1458916/pexels-photo-1458916.jpeg?auto=compress&cs=tinysrgb&w=400', 0, 67, '2024-04-01');

-- =============================================
-- 插入询价订单数据 (6条)
-- =============================================
INSERT INTO inquiry_order (id, order_no, user_id, user_name, user_phone, address, items, total_amount, status, remark, admin_note, created_at, updated_at) VALUES
('i001', 'INQ20240601001', 'u001', '张小花', '13800138001', '广东省广州市天河区XX街道123号', '[{"dollId": "d001", "dollName": "樱花精灵", "dollPrice": 299, "accessories": [{"id": "a001", "name": "蕾丝头饰", "price": 29}, {"id": "a002", "name": "公主礼服", "price": 89}], "totalPrice": 417}]', 417.00, 'pending', '希望可以定制颜色，最好是粉色系', '', '2024-06-01 14:23:00', '2024-06-01 14:23:00'),
('i002', 'INQ20240601002', 'u002', '李美丽', '13900139002', '上海市浦东新区XX路456号', '[{"dollId": "d002", "dollName": "蓝眼猫咪", "dollPrice": 189, "accessories": [{"id": "a005", "name": "礼盒包装", "price": 59}], "totalPrice": 248}]', 248.00, 'quoted', '送礼用，需要精美包装', '已报价，等待客户确认', '2024-06-01 16:45:00', '2024-06-02 09:30:00'),
('i003', 'INQ20240602001', 'u003', '王大宝', '15000150003', '', '[{"dollId": "d003", "dollName": "月光兔兔", "dollPrice": 259, "accessories": [{"id": "a001", "name": "蕾丝头饰", "price": 29}, {"id": "a004", "name": "魔法棒", "price": 49}, {"id": "a005", "name": "礼盒包装", "price": 59}], "totalPrice": 396}]', 396.00, 'contacted', '', '', '2024-06-02 10:12:00', '2024-06-02 11:00:00'),
('i004', 'INQ20240602002', 'u004', '陈小明', '18600186004', '北京市朝阳区XX大道789号', '[{"dollId": "d004", "dollName": "复古熊先生", "dollPrice": 359, "accessories": [{"id": "a002", "name": "公主礼服", "price": 89}, {"id": "a006", "name": "汉服套装", "price": 129}], "totalPrice": 577}]', 577.00, 'closed', '批量采购20套，询价', '成交，已安排生产', '2024-06-02 15:33:00', '2024-06-03 10:00:00'),
('i005', 'INQ20240603001', 'u005', '刘晓红', '13700137005', '', '[{"dollId": "d005", "dollName": "彩虹小马", "dollPrice": 219, "accessories": [{"id": "a003", "name": "水晶鞋", "price": 39}], "totalPrice": 258}]', 258.00, 'cancelled', '想了解最小起订量', '', '2024-06-03 09:00:00', '2024-06-03 14:00:00'),
('i006', 'INQ20240603002', 'u006', '赵天天', '18900189006', '', '[{"dollId": "d001", "dollName": "樱花精灵", "dollPrice": 299, "accessories": [{"id": "a006", "name": "汉服套装", "price": 129}, {"id": "a005", "name": "礼盒包装", "price": 59}], "totalPrice": 487}]', 487.00, 'pending', '节日礼品批量定制，数量50套', '', '2024-06-03 16:20:00', '2024-06-03 16:20:00');

-- =============================================
-- 插入库存记录数据 (8条)
-- =============================================
INSERT INTO inventory_record (id, product_type, product_id, product_name, type, quantity, reason, operator, balance_before, balance_after, created_at) VALUES
('ir001', 'doll', 'd001', '樱花精灵', 'in', 50, '生产入库', 'admin', 0, 50, '2024-05-01'),
('ir002', 'doll', 'd001', '樱花精灵', 'out', 2, '订单出库', 'staff01', 50, 48, '2024-05-15'),
('ir003', 'accessory', 'a002', '公主礼服', 'in', 100, '采购入库', 'admin', 0, 100, '2024-05-10'),
('ir004', 'accessory', 'a002', '公主礼服', 'out', 15, '订单出库', 'staff01', 100, 85, '2024-05-20'),
('ir005', 'doll', 'd003', '月光兔兔', 'in', 30, '生产入库', 'admin', 0, 30, '2024-05-05'),
('ir006', 'doll', 'd003', '月光兔兔', 'out', 22, '订单出库', 'staff02', 30, 8, '2024-05-28'),
('ir007', 'accessory', 'a003', '水晶鞋', 'in', 50, '采购入库', 'admin', 0, 50, '2024-05-12'),
('ir008', 'accessory', 'a003', '水晶鞋', 'out', 38, '订单出库 + 损耗', 'staff01', 50, 12, '2024-05-30');

-- =============================================
-- 插入跟进记录数据 (根据询价订单状态)
-- =============================================
INSERT INTO follow_up_record (id, inquiry_id, status, operator, note, created_at) VALUES
('f001', 'i001', 'pending', '系统', '创建询价单', '2024-06-01 14:23:00'),
('f002', 'i002', 'quoted', 'manager01', '已报价，等待客户确认', '2024-06-02 09:30:00'),
('f003', 'i003', 'contacted', 'staff01', '已电话联系客户', '2024-06-02 11:00:00'),
('f004', 'i004', 'closed', 'manager01', '成交，已安排生产', '2024-06-03 10:00:00'),
('f005', 'i005', 'cancelled', 'staff01', '客户取消询价', '2024-06-03 14:00:00'),
('f006', 'i006', 'pending', '系统', '创建询价单', '2024-06-03 16:20:00');

-- =============================================
-- 验证插入结果
-- =============================================
SELECT '娃娃表' as table_name, COUNT(*) as count FROM doll
UNION ALL SELECT '配饰表', COUNT(*) FROM accessory
UNION ALL SELECT '用户表', COUNT(*) FROM user
UNION ALL SELECT '管理员表', COUNT(*) FROM admin
UNION ALL SELECT '搭配方案表', COUNT(*) FROM outfit_template
UNION ALL SELECT '询价订单表', COUNT(*) FROM inquiry_order
UNION ALL SELECT '库存记录表', COUNT(*) FROM inventory_record
UNION ALL SELECT '跟进记录表', COUNT(*) FROM follow_up_record;
