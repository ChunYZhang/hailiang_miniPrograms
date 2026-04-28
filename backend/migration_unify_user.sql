-- =============================================
-- 小程序用户表结构变更
-- 将 user 表改造为统一用户表
-- =============================================

USE hailiang_doll;

-- 1. 添加 openid 字段
ALTER TABLE user ADD COLUMN openid VARCHAR(100) DEFAULT '' COMMENT '微信openid' AFTER avatar;

-- 2. 修改 status 字段，增加 pending 状态
ALTER TABLE user MODIFY COLUMN status ENUM('active', 'disabled', 'pending') NOT NULL DEFAULT 'pending' COMMENT '状态: active=正常, disabled=禁用, pending=待审核';

-- 3. 修改 phone 字段为可选
ALTER TABLE user MODIFY COLUMN phone VARCHAR(20) DEFAULT '' COMMENT '手机号';

-- 4. 修改 password 字段为可选
ALTER TABLE user MODIFY COLUMN password VARCHAR(100) DEFAULT '' COMMENT '密码(MD5加密)';

-- 5. 添加索引
ALTER TABLE user ADD INDEX idx_openid (openid);
