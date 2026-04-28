-- =============================================
-- migration_add_selected_accessories.sql
-- 为娃娃表添加已选配饰字段，直接存储配饰关联
-- =============================================

USE hailiang_doll;

-- 添加已选配饰字段（存储配饰ID列表）
ALTER TABLE doll ADD COLUMN selected_accessories JSON DEFAULT NULL COMMENT '已选配饰列表(JSON数组: [{id, name, price}])' AFTER default_accessory;
