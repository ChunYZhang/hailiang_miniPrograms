-- =============================================
-- 海亮布娃娃定制询价管理系统 数据库初始化脚本
-- 数据库: hailiang_doll
-- =============================================

CREATE DATABASE IF NOT EXISTS hailiang_doll DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hailiang_doll;

-- =============================================
-- 1. 系列表 (Series)
-- 用于管理娃娃系列和配饰系列
-- =============================================
DROP TABLE IF EXISTS series;
CREATE TABLE series (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(100) NOT NULL COMMENT '系列名称',
    description VARCHAR(500) DEFAULT '' COMMENT '系列描述',
    type ENUM('doll', 'accessory', 'both') NOT NULL DEFAULT 'doll' COMMENT '适用类型: doll=娃娃系列, accessory=配饰系列, both=通用',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '状态: active=启用, inactive=停用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_type (type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系列表';

-- =============================================
-- 2. 分类表 (Category)
-- 用于管理配饰的分类
-- =============================================
DROP TABLE IF EXISTS category;
CREATE TABLE category (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    value VARCHAR(50) NOT NULL COMMENT '分类标识值(英文)',
    description VARCHAR(500) DEFAULT '' COMMENT '分类描述',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '状态: active=启用, inactive=停用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_value (value),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- =============================================
-- 3. 娃娃表 (Doll)
-- =============================================
DROP TABLE IF EXISTS doll;
CREATE TABLE doll (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '娃娃名称',
    price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '售价',
    material VARCHAR(200) DEFAULT '' COMMENT '材质',
    size VARCHAR(50) DEFAULT '' COMMENT '尺寸',
    stock INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '状态: active=上架, inactive=下架',
    series VARCHAR(100) DEFAULT '' COMMENT '所属系列名称',
    patent_no VARCHAR(100) DEFAULT '' COMMENT '专利编号',
    description TEXT COMMENT '详细介绍',
    images JSON DEFAULT NULL COMMENT '图片URL列表(JSON数组)',
    views INT NOT NULL DEFAULT 0 COMMENT '浏览量',
    inquiries INT NOT NULL DEFAULT 0 COMMENT '询价次数',
    low_stock_threshold INT NOT NULL DEFAULT 10 COMMENT '库存预警阈值',
    min_quantity INT NOT NULL DEFAULT 1 COMMENT '起购数量',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_series (series),
    INDEX idx_status (status),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='娃娃表';

-- =============================================
-- 4. 配饰表 (Accessory)
-- =============================================
DROP TABLE IF EXISTS accessory;
CREATE TABLE accessory (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '配饰名称',
    category VARCHAR(50) NOT NULL COMMENT '分类标识值',
    series VARCHAR(100) DEFAULT '' COMMENT '所属系列名称',
    price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '售价',
    stock INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '状态: active=上架, inactive=下架',
    material VARCHAR(200) DEFAULT '' COMMENT '材质',
    description TEXT COMMENT '详细介绍',
    images JSON DEFAULT NULL COMMENT '图片URL列表(JSON数组)',
    applicable_dolls JSON DEFAULT NULL COMMENT '适用娃娃ID列表(JSON数组)',
    views INT NOT NULL DEFAULT 0 COMMENT '浏览量',
    low_stock_threshold INT NOT NULL DEFAULT 20 COMMENT '库存预警阈值',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_series (series),
    INDEX idx_status (status),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配饰表';

-- =============================================
-- 5. 搭配方案表 (OutfitTemplate)
-- =============================================
DROP TABLE IF EXISTS outfit_template;
CREATE TABLE outfit_template (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '方案名称',
    doll_id VARCHAR(36) NOT NULL COMMENT '基础娃娃ID',
    doll_name VARCHAR(200) NOT NULL COMMENT '基础娃娃名称',
    accessories JSON DEFAULT NULL COMMENT '配饰列表(JSON数组: [{id, name, price}])',
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '总价',
    cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
    is_hot TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否热门: 0=否, 1=是',
    usage_count INT NOT NULL DEFAULT 0 COMMENT '使用次数',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_doll_id (doll_id),
    INDEX idx_is_hot (is_hot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搭配方案表';

-- =============================================
-- 6. 用户表 (User)
-- =============================================
DROP TABLE IF EXISTS user;
CREATE TABLE user (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
    password VARCHAR(100) DEFAULT '' COMMENT '密码(MD5加密)',
    nickname VARCHAR(100) DEFAULT '' COMMENT '昵称',
    avatar VARCHAR(500) DEFAULT '' COMMENT '头像URL',
    openid VARCHAR(100) DEFAULT '' COMMENT '微信openid',
    status ENUM('active', 'disabled', 'pending') NOT NULL DEFAULT 'pending' COMMENT '状态: active=正常, disabled=禁用, pending=待审核',
    region VARCHAR(100) DEFAULT '' COMMENT '地区',
    register_ip VARCHAR(50) DEFAULT '' COMMENT '注册IP',
    inquiry_count INT NOT NULL DEFAULT 0 COMMENT '询价次数',
    last_active DATETIME DEFAULT NULL COMMENT '最后活跃时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_phone (phone),
    INDEX idx_openid (openid),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =============================================
-- 6.5 用户收货地址表 (UserAddress)
-- =============================================
DROP TABLE IF EXISTS user_address;
CREATE TABLE user_address (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    name VARCHAR(50) NOT NULL COMMENT '收件人姓名',
    phone VARCHAR(20) NOT NULL COMMENT '收件人电话',
    province VARCHAR(50) NOT NULL COMMENT '省份',
    city VARCHAR(50) NOT NULL COMMENT '城市',
    district VARCHAR(50) DEFAULT '' COMMENT '区县',
    detail VARCHAR(200) NOT NULL COMMENT '详细地址',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认地址: 0=否, 1=是',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_user_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收货地址表';

-- =============================================
-- 7. 询价订单表 (InquiryOrder)
-- =============================================
DROP TABLE IF EXISTS inquiry_order;
CREATE TABLE inquiry_order (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    order_no VARCHAR(50) NOT NULL COMMENT '询价单号',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    user_name VARCHAR(100) NOT NULL COMMENT '客户姓名',
    user_phone VARCHAR(20) NOT NULL COMMENT '客户电话',
    address VARCHAR(500) DEFAULT '' COMMENT '收货地址',
    items JSON DEFAULT NULL COMMENT '询价清单(JSON数组)',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '总报价',
    status ENUM('pending', 'contacted', 'quoted', 'closed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态: pending=待处理, contacted=已联系, quoted=已报价, closed=已成交, cancelled=已取消',
    remark TEXT COMMENT '客户备注',
    admin_note TEXT COMMENT '管理员备注',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_user_phone (user_phone),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价订单表';

-- =============================================
-- 8. 跟进记录表 (FollowUpRecord)
-- =============================================
DROP TABLE IF EXISTS follow_up_record;
CREATE TABLE follow_up_record (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    inquiry_id VARCHAR(36) NOT NULL COMMENT '询价订单ID',
    status VARCHAR(50) NOT NULL COMMENT '变更后的状态',
    operator VARCHAR(100) NOT NULL DEFAULT '管理员' COMMENT '操作人',
    note TEXT COMMENT '跟进备注',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_inquiry_id (inquiry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='跟进记录表';

-- =============================================
-- 9. 管理员表 (Admin)
-- =============================================
DROP TABLE IF EXISTS admin;
CREATE TABLE admin (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    username VARCHAR(100) NOT NULL COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码(MD5加密)',
    role ENUM('super', 'manager', 'staff') NOT NULL DEFAULT 'staff' COMMENT '角色: super=超级管理员, manager=经理, staff=员工',
    email VARCHAR(200) DEFAULT '' COMMENT '邮箱',
    last_login DATETIME DEFAULT NULL COMMENT '最后登录时间',
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active' COMMENT '状态: active=正常, disabled=禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- =============================================
-- 10. 库存记录表 (InventoryRecord)
-- =============================================
DROP TABLE IF EXISTS inventory_record;
CREATE TABLE inventory_record (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    product_type ENUM('doll', 'accessory') NOT NULL COMMENT '商品类型: doll=娃娃, accessory=配饰',
    product_id VARCHAR(36) NOT NULL COMMENT '商品ID',
    product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
    type ENUM('in', 'out') NOT NULL COMMENT '类型: in=入库, out=出库',
    quantity INT NOT NULL COMMENT '数量',
    reason VARCHAR(200) DEFAULT '' COMMENT '原因',
    operator VARCHAR(100) NOT NULL COMMENT '操作人',
    balance_before INT NOT NULL DEFAULT 0 COMMENT '变动前余额',
    balance_after INT NOT NULL DEFAULT 0 COMMENT '变动后余额',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_product (product_type, product_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存记录表';

-- =============================================
-- 11. 系统日志表 (SystemLog)
-- =============================================
DROP TABLE IF EXISTS system_log;
CREATE TABLE system_log (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    action VARCHAR(100) NOT NULL COMMENT '操作动作',
    operator VARCHAR(100) NOT NULL COMMENT '操作人',
    ip VARCHAR(50) DEFAULT '' COMMENT 'IP地址',
    detail TEXT COMMENT '操作详情',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_operator (operator),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- =============================================
-- 12. 企业信息表 (CompanyInfo)
-- =============================================
DROP TABLE IF EXISTS company_info;
CREATE TABLE company_info (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '公司名称',
    slogan VARCHAR(200) DEFAULT '' COMMENT '公司标语',
    phone VARCHAR(50) DEFAULT '' COMMENT '联系电话',
    address VARCHAR(500) DEFAULT '' COMMENT '公司地址',
    work_hours VARCHAR(200) DEFAULT '' COMMENT '工作时间',
    email VARCHAR(200) DEFAULT '' COMMENT '邮箱',
    description TEXT COMMENT '公司简介',
    map_lng VARCHAR(50) DEFAULT '' COMMENT '地图经度',
    map_lat VARCHAR(50) DEFAULT '' COMMENT '地图纬度',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业信息表';

-- =============================================
-- 13.5 资质证书表 (Certificate)
-- =============================================
DROP TABLE IF EXISTS certificate;
CREATE TABLE certificate (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '证书名称',
    image VARCHAR(500) NOT NULL COMMENT '证书图片URL',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序(越大越靠前)',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '状态: active=显示, inactive=隐藏',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_sort (sort),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资质证书表';

-- =============================================
-- 13. Banner表 (Banner)
-- =============================================
DROP TABLE IF EXISTS banner;
CREATE TABLE banner (
    id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
    title VARCHAR(200) NOT NULL COMMENT 'Banner标题',
    image VARCHAR(500) NOT NULL COMMENT '图片URL',
    link VARCHAR(500) DEFAULT '' COMMENT '跳转链接',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序(越大越靠前)',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '状态: active=显示, inactive=隐藏',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_sort (sort),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Banner表';

-- =============================================
-- 14. 邮件配置表 (EmailConfig)
-- =============================================
DROP TABLE IF EXISTS email_config;
CREATE TABLE email_config (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    smtp_server VARCHAR(200) DEFAULT '' COMMENT 'SMTP服务器',
    smtp_port INT DEFAULT 465 COMMENT 'SMTP端口',
    smtp_username VARCHAR(200) DEFAULT '' COMMENT '用户名',
    smtp_password VARCHAR(200) DEFAULT '' COMMENT '密码',
    from_name VARCHAR(200) DEFAULT '' COMMENT '发件人名称',
    enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否启用: 0=否, 1=是',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮件配置表';

-- =============================================
-- 初始化默认数据
-- =============================================

-- 插入默认管理员 (密码: admin123)
INSERT INTO admin (id, username, password, role, email, status) VALUES
('adm001', 'admin', MD5('admin123'), 'super', 'admin@hailiang.com', 'active'),
('adm002', 'manager01', MD5('manager123'), 'manager', 'manager@hailiang.com', 'active');

-- 插入默认系列
INSERT INTO series (id, name, description, type, status) VALUES
('s001', '花园系列', '以自然花卉为主题，色彩柔和', 'doll', 'active'),
('s002', '萌宠系列', '可爱动物造型，深受儿童喜爱', 'doll', 'active'),
('s003', '梦幻系列', '梦幻童话风格设计', 'doll', 'active'),
('s004', '经典系列', '经典复古风格，收藏价值高', 'doll', 'active'),
('s005', '童话系列', '童话故事主题系列', 'doll', 'active'),
('s006', '特效系列', '特殊材料制作，具有特殊效果', 'doll', 'inactive'),
('s007', '宫廷系列', '以宫廷风格为主题的配饰系列', 'accessory', 'active'),
('s008', '国风系列', '中国传统风格配饰', 'accessory', 'active'),
('s009', '基础系列', '百搭基础款配饰', 'both', 'active');

-- 插入默认分类
INSERT INTO category (id, name, value, description, status) VALUES
('c001', '头饰', 'headwear', '发箍、发夹、帽子等头部配饰', 'active'),
('c002', '衣服', 'clothing', '各类服装套装', 'active'),
('c003', '鞋子', 'shoes', '各类鞋款', 'active'),
('c004', '道具', 'props', '手持道具、装饰品', 'active'),
('c005', '礼盒包装', 'giftbox', '礼品包装盒', 'active');

-- 插入默认企业信息
INSERT INTO company_info (name, phone, address, work_hours, email, website, description) VALUES
('海亮布娃娃工厂', '400-888-9999', '浙江省杭州市西湖区文三路123号', '周一至周六 9:00-18:00', 'contact@hailiang.com', 'https://www.hailiang.com', '专业定制各类布娃娃，款式多样，品质优良');

-- 插入示例资质证书
INSERT INTO certificate (id, name, image, sort, status) VALUES
('cert001', '营业执照', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800', 1, 'active'),
('cert002', '产品质量认证', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', 2, 'active'),
('cert003', '企业荣誉证书', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', 3, 'active');

-- 插入示例Banner
INSERT INTO banner (id, title, image, link, sort, status) VALUES
('b001', '新品上市', 'https://images.pexels.com/photos/3661261/pexels-photo-3661261.jpeg?auto=compress&cs=tinysrgb&w=800', '', 1, 'active'),
('b002', '限时优惠', 'https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=800', '', 2, 'active');
