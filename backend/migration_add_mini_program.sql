-- =============================================
-- 小程序功能数据库变更脚本
-- =============================================

USE hailiang_doll;

-- 1. 给 doll 表添加 is_hot 字段
ALTER TABLE doll ADD COLUMN is_hot TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否热门: 0=否, 1=是' AFTER status;

-- 1.1 给 doll 表添加起购数量字段
ALTER TABLE doll ADD COLUMN min_quantity INT NOT NULL DEFAULT 1 COMMENT '起购数量' AFTER is_hot;

-- 2. 给 accessory 表添加 is_hot 字段
ALTER TABLE accessory ADD COLUMN is_hot TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否热门: 0=否, 1=是' AFTER status;

-- 3. 给 banner 表添加 link_type 和 link_id
ALTER TABLE banner ADD COLUMN link_type VARCHAR(20) DEFAULT '' COMMENT '链接类型: doll/accessory/outfit/none' AFTER link;
ALTER TABLE banner ADD COLUMN link_id VARCHAR(36) DEFAULT '' COMMENT '关联商品ID' AFTER link_type;

-- 4. 小程序用户收藏表
CREATE TABLE IF NOT EXISTS mini_user_favorite (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    item_type ENUM('doll', 'accessory', 'outfit') NOT NULL COMMENT '商品类型',
    item_id VARCHAR(36) NOT NULL COMMENT '商品ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_item (user_id, item_type, item_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序用户收藏表';

-- 5. 小程序用户购物车表
CREATE TABLE IF NOT EXISTS mini_cart (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    item_type ENUM('doll', 'accessory', 'outfit') NOT NULL COMMENT '商品类型',
    item_id VARCHAR(36) NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    accessories JSON DEFAULT NULL COMMENT '已选配饰列表JSON: [{id, name, price}]',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序用户购物车表';

-- 6. 小程序用户浏览历史表
CREATE TABLE IF NOT EXISTS mini_browse_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    item_type ENUM('doll', 'accessory', 'outfit') NOT NULL COMMENT '商品类型',
    item_id VARCHAR(36) NOT NULL COMMENT '商品ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序用户浏览历史表';

-- 7. 小程序用户自定义搭配分类表
CREATE TABLE IF NOT EXISTS mini_user_outfit_category (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序用户自定义搭配分类表';

-- 8. 小程序用户自定义搭配方案表
CREATE TABLE IF NOT EXISTS mini_user_outfit (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL COMMENT '所属分类ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    name VARCHAR(200) NOT NULL COMMENT '方案名称',
    doll_id VARCHAR(36) DEFAULT '' COMMENT '基础娃娃ID',
    doll_name VARCHAR(200) DEFAULT '' COMMENT '基础娃娃名称',
    accessories JSON DEFAULT NULL COMMENT '配饰列表',
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '总价',
    cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_id (category_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小程序用户自定义搭配方案表';

-- 9. 微信用户注册申请表（待审核）
CREATE TABLE IF NOT EXISTS mini_user_register (
    id VARCHAR(36) PRIMARY KEY,
    openid VARCHAR(100) NOT NULL COMMENT '微信openid',
    nickname VARCHAR(100) DEFAULT '' COMMENT '微信昵称',
    avatar VARCHAR(500) DEFAULT '' COMMENT '微信头像',
    phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_openid (openid),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信用户注册申请表';
