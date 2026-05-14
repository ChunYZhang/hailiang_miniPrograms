"""
布娃娃定制询价管理系统配置文件
所有配置独立存放，不硬编码
"""

import os

# ==================== 数据库配置 ====================
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "9$kP7s@R2#tG5z&Q8b!L6",
    "database": "hailiang_doll",
    "charset": "utf8mb4"
}

# ==================== 邮件配置 ====================
EMAIL_CONFIG = {
    "smtp_server": "smtp.exmail.qq.com",
    "smtp_port": 465,
    "smtp_username": "verifycode@aiwisely.cn",
    "smtp_password": "foh5YqHcD458mE4G",
    "from_email": "verifycode@aiwisely.cn",
    "from_name": "海亮布娃娃定制"
}

# ==================== 短信配置（仅预留，不发送） ====================
SMS_CONFIG = {
    "enabled": False,  # 短信功能预留，暂不启用
    "app_id": "",
    "app_key": "",
    "receive_phones": []  # 接收短信的手机号列表
}

# ==================== 系统配置 ====================
SYSTEM_CONFIG = {
    "app_name": "海亮布娃娃定制询价管理系统",
    "app_version": "1.0.0",
    "debug": True,
    "secret_key": "hailiang_doll_secret_key_2024",
    "cookie_name": "hailiang_session",
    "cookie_age": 604800  # 7天
}

# ==================== 域名配置 ====================
DOMAIN_CONFIG = {
    "frontend_url": "http://localhost:8080",
    "backend_url": "http://localhost:5000",
    "upload_path": os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
}

# ==================== 文件上传配置 ====================
UPLOAD_CONFIG = {
    "max_file_size": 10 * 1024 * 1024,  # 10MB
    "allowed_extensions": {"jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"},
    "upload_folder": os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
}

# ==================== 库存预警配置 ====================
INVENTORY_CONFIG = {
    "low_stock_threshold": 10,  # 库存预警阈值
    "warning_enabled": True
}

# ==================== 验证码配置（固定123456） ====================
VERIFY_CODE_CONFIG = {
    "固定验证码": "123456",
    "有效期": 300  # 5分钟
}

# ==================== 分页配置 ====================
PAGE_CONFIG = {
    "default_page_size": 20,
    "max_page_size": 100
}
