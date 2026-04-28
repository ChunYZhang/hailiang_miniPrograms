-- =============================================
-- migration_add_default_accessory.sql
-- 添加娃娃表的默认配饰字段
-- =============================================

USE hailiang_doll;

-- 为 doll 表添加 default_accessory 字段（用户自定义输入的默认配饰名称）
ALTER TABLE doll ADD COLUMN default_accessory VARCHAR(500) DEFAULT '' COMMENT '默认配饰（用户自定义输入）' AFTER min_quantity;
