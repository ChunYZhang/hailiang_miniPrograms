-- =============================================
-- 添加拼单字段到购物车表
-- =============================================

USE hailiang_doll;

-- 检查并添加 pindan_group_id 列
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'hailiang_doll'
    AND TABLE_NAME = 'mini_cart'
    AND COLUMN_NAME = 'pindan_group_id'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE mini_cart ADD COLUMN pindan_group_id VARCHAR(36) DEFAULT NULL COMMENT "拼单组ID" AFTER quantity',
    'SELECT "Column pindan_group_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 pindan_group_name 列
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'hailiang_doll'
    AND TABLE_NAME = 'mini_cart'
    AND COLUMN_NAME = 'pindan_group_name'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE mini_cart ADD COLUMN pindan_group_name VARCHAR(100) DEFAULT NULL COMMENT "拼单组名称" AFTER pindan_group_id',
    'SELECT "Column pindan_group_name already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 accessories 列（如果不存在）
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'hailiang_doll'
    AND TABLE_NAME = 'mini_cart'
    AND COLUMN_NAME = 'accessories'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE mini_cart ADD COLUMN accessories JSON DEFAULT NULL COMMENT "已选配饰列表JSON" AFTER item_id',
    'SELECT "Column accessories already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
