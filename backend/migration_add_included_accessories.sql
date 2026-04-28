-- 给 doll 表添加附带配饰字段
USE hailiang_doll;

ALTER TABLE doll ADD COLUMN included_accessories JSON DEFAULT NULL COMMENT '附带配饰ID列表(JSON数组)' AFTER patent_no;
