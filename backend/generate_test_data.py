"""
生成测试数据脚本
为海亮布娃娃定制询价管理系统生成各表测试数据
"""
import os
import uuid
import random
import hashlib
import datetime
import json
import urllib.request
import urllib.parse
import time

DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "hailiang_doll",
    "password": "3wZzebk7GAJZDt24",
    "database": "hailiang_doll",
    "charset": "utf8mb4"
}

def get_db():
    import pymysql
    from pymysql.cursors import DictCursor
    return pymysql.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"],
        charset=DB_CONFIG["charset"],
        cursorclass=DictCursor
    )

def md5_password(password):
    return hashlib.md5(password.encode()).hexdigest()

def generate_uuid():
    return str(uuid.uuid4())

def now():
    return datetime.datetime.now()

def make_placeholder_url(width, height, text, bg="F43F5E", fg="FFFFFF"):
    """使用本地文件路径作为占位图URL"""
    return f"https://placehold.co/{width}x{height}/{bg}/{fg}?text={urllib.parse.quote(text)}"

# ====== 测试数据 ======

SERIES_DATA = [
    ("花园系列", "梦幻花园主题，蕾丝与花朵元素", "doll"),
    ("宫廷系列", "欧式宫廷华丽风格，金线刺绣", "doll"),
    ("森林系列", "自然森系风格，树叶与动物元素", "doll"),
    ("节日系列", "圣诞、新年等节日主题限定款", "both"),
    ("公主系列", "华丽的公主裙装，层层纱裙设计", "doll"),
    ("古风系列", "汉服旗袍风格，传承东方之美", "both"),
    ("学院系列", "英伦学院风，格子裙与蝴蝶结", "doll"),
    ("精灵系列", "童话精灵风格，翅膀与魔法元素", "doll"),
    ("海洋系列", "海底世界主题，贝壳与海星装饰", "both"),
    ("萌宠系列", "可爱动物造型，陪伴孩子成长", "doll"),
    ("星空系列", "神秘星空主题，银河与彗星点缀", "doll"),
    ("糖果系列", "甜蜜糖果色系，马卡龙色调", "accessory"),
    ("冰雪系列", "冰雪奇缘灵感，冰晶与雪花元素", "accessory"),
    ("运动系列", "活力运动风格，适合户外穿着", "accessory"),
    ("和风系列", "日式和风设计，樱花与和服元素", "accessory"),
    ("波西系列", "波西米亚风格，流苏与民族图案", "accessory"),
    ("朋克系列", "酷炫朋克风，铆钉与金属元素", "accessory"),
    ("田园系列", "法式田园风格，碎花与荷叶边", "accessory"),
    ("科幻系列", "未来科技感，LED灯光元素", "accessory"),
    ("童话系列", "经典童话造型，南瓜车与水晶鞋", "accessory"),
]

CATEGORY_DATA = [
    ("头饰", "headwear", "各类发饰、帽子、头箍等"),
    ("衣服", "clothing", "上衣、裙子、套装等服装"),
    ("鞋子", "shoes", "各类童鞋、公主鞋、靴子"),
    ("配饰", "accessory_general", "项链、手链、耳环等"),
    ("道具", "props", "魔法棒、扇子、背包等"),
    ("礼盒包装", "giftbox", "精美礼盒包装套装"),
    ("袜子", "socks", "各类棉袜、长筒袜"),
    ("手套", "gloves", "手套、袖套等"),
    ("围巾", "scarf", "围巾、披肩等"),
    ("玩具", "toy", "毛绒玩具、玩偶配件"),
]

DOLL_DATA = [
    ("星之公主·露娜", 899, "优质棉麻", "45cm", 58, "公主系列", "ZL202310001234", "梦幻星空公主，手工缝制蕾丝裙摆", 898, 10),
    ("花语精灵·小雪", 788, "纯棉面料", "40cm", 35, "花园系列", "ZL202310002345", "花园精灵主题，立体花朵装饰", 756, 10),
    ("森林守护者·小绿", 699, "有机棉", "42cm", 42, "森林系列", "ZL202310003456", "森林主题套装，配动物玩偶", 623, 8),
    ("宫廷贵族·伊莎", 1280, "真丝面料", "50cm", 20, "宫廷系列", "ZL202310004567", "欧式宫廷礼服，金线刺绣", 542, 5),
    ("古风少女·婉儿", 968, "丝绸面料", "43cm", 30, "古风系列", "ZL202310005678", "汉服风格，绣花长裙", 489, 8),
    ("海洋公主·小蓝", 858, "防水面料", "44cm", 45, "海洋系列", "ZL202310006789", "人鱼公主主题，贝壳装饰", 678, 10),
    ("糖果甜心·小粉", 568, "柔软棉", "35cm", 80, "糖果系列", "ZL202310007890", "马卡龙色系，甜美可爱", 934, 15),
    ("冰雪女王·艾拉", 1188, "丝绒面料", "48cm", 25, "冰雪系列", "ZL202310008901", "冰雪主题，水钻点缀", 456, 8),
    ("精灵宝贝·小羽", 799, "网纱面料", "38cm", 40, "精灵系列", "ZL202310009012", "带翅膀的精灵套装", 567, 10),
    ("学院风·小淑", 688, "格子面料", "40cm", 55, "学院系列", "ZL202310010123", "英伦学院风，蝴蝶结设计", 723, 12),
    ("星空漫游者·小星", 999, "闪光面料", "42cm", 33, "星空系列", "ZL202310011234", "银河星空主题，夜光纱线", 345, 10),
    ("萌宠伙伴·小汪", 628, "毛绒面料", "40cm", 50, "萌宠系列", "ZL202310012345", "小狗造型，可抱可穿", 812, 10),
    ("波西米亚·小吉", 748, "棉麻面料", "41cm", 38, "波西系列", "ZL202310013456", "波西米亚风格，流苏装饰", 456, 10),
    ("和风物语·小樱", 888, "和服面料", "43cm", 28, "和风系列", "ZL202310014567", "樱花和服，精致刺绣", 398, 8),
    ("童话公主·辛德瑞拉", 1388, "奢华纱裙", "52cm", 15, "童话系列", "ZL202310015678", "南瓜车主题，限量版", 234, 5),
    ("朋克公主·小酷", 758, "PU皮革", "42cm", 40, "朋克系列", "ZL202310016789", "铆钉装饰，亮片点缀", 567, 10),
    ("田园诗人·小芳", 648, "碎花棉布", "39cm", 62, "田园系列", "ZL202310017890", "法式碎花裙，荷叶边袖", 890, 15),
    ("科技先锋·小智", 898, "功能性面料", "44cm", 36, "科幻系列", "ZL202310018901", "LED灯光科幻主题", 345, 10),
    ("梦幻独角兽·小瑞", 1088, "闪光绒毛", "46cm", 22, "童话系列", "ZL202310019012", "独角兽主题，彩虹鬃毛", 456, 8),
    ("英伦小淑女·安妮", 728, "精纺毛呢", "41cm", 48, "学院系列", "ZL202310020123", "格子裙套装，配领结", 678, 12),
]

ACCESSORY_DATA = [
    ("梦幻发箍", "headwear", "花园系列", 68, 120, "蕾丝花边发箍，镶小珠子", 25),
    ("公主王冠", "headwear", "公主系列", 128, 85, "金色镂空王冠，嵌水晶", 20),
    ("樱花发夹", "headwear", "和风系列", 38, 200, "樱花造型发夹，粉嫩配色", 30),
    ("精灵翅膀", "props", "精灵系列", 188, 60, "透明网纱翅膀，带闪光", 15),
    ("魔法棒", "props", "童话系列", 88, 90, "星星魔法棒，带铃铛", 20),
    ("蕾丝袜子", "socks", "公主系列", 48, 150, "白色长筒蕾丝袜", 25),
    ("珍珠项链", "accessory_general", "宫廷系列", 98, 75, "人造珍珠项链，可调节", 30),
    ("蝴蝶结发带", "headwear", "糖果系列", 45, 180, "粉色蝴蝶结发带，丝绒质感", 25),
    ("小背包", "props", "森林系列", 78, 95, "动物造型小背包，零钱包", 20),
    ("毛绒手套", "gloves", "萌宠系列", 58, 110, "兔子耳朵手套，加绒保暖", 25),
    ("围巾披肩", "scarf", "古风系列", 88, 70, "绣花丝巾，古典花纹", 20),
    ("贝壳耳环", "accessory_general", "海洋系列", 55, 130, "扇贝造型耳环，珍珠点缀", 30),
    ("星星贴纸套装", "props", "星空系列", 28, 250, "夜光星星贴，可贴皮肤", 40),
    ("格子丝带", "socks", "学院系列", 35, 160, "英伦格纹发带", 25),
    ("和风纸扇", "props", "和风系列", 68, 88, "日式折纸扇，樱花图案", 20),
    ("水晶手链", "accessory_general", "冰雪系列", 78, 95, "人造水晶手链，闪亮设计", 25),
    ("毛球耳套", "gloves", "冰雪系列", 48, 100, "熊耳毛绒耳套，加厚保暖", 30),
    ("流苏挂件", "props", "波西系列", 38, 140, "彩色流苏挂件，民族风", 25),
    ("碎花发绳套装", "headwear", "田园系列", 28, 220, "5条套装，多色碎花", 35),
    ("LED发光戒指", "accessory_general", "科幻系列", 58, 160, "七彩LED灯戒指，USB充电", 25),
]

OUTFIT_DATA = [
    ("公主全套豪华版", 0, "星之公主·露娜", [{"id":"a1","name":"梦幻发箍","price":68},{"id":"a2","name":"公主王冠","price":128},{"id":"a5","name":"蕾丝袜子","price":48}], "公主系列", True, 188),
    ("精灵魔法套装", 0, "精灵宝贝·小羽", [{"id":"a4","name":"精灵翅膀","price":188},{"id":"a6","name":"魔法棒","price":88},{"id":"a8","name":"蝴蝶结发带","price":45}], "精灵系列", True, 321),
    ("古风少女套装", 0, "古风少女·婉儿", [{"id":"a3","name":"樱花发夹","price":38},{"id":"a9","name":"围巾披肩","price":88},{"id":"a15","name":"和风纸扇","price":68}], "古风系列", False, 194),
    ("海洋公主套装", 0, "海洋公主·小蓝", [{"id":"a10","name":"小背包","price":78},{"id":"a12","name":"贝壳耳环","price":55}], "海洋系列", True, 133),
    ("糖果甜心套装", 0, "糖果甜心·小粉", [{"id":"a8","name":"蝴蝶结发带","price":45},{"id":"a11","name":"珍珠项链","price":98}], "糖果系列", True, 143),
    ("学院小淑套装", 0, "学院风·小淑", [{"id":"a14","name":"格子丝带","price":35},{"id":"a6","name":"蕾丝袜子","price":48}], "学院系列", False, 83),
    ("冰雪女王套装", 0, "冰雪女王·艾拉", [{"id":"a16","name":"水晶手链","price":78},{"id":"a17","name":"毛球耳套","price":48}], "冰雪系列", True, 126),
    ("森林冒险套装", 0, "森林守护者·小绿", [{"id":"a10","name":"小背包","price":78},{"id":"a9","name":"毛绒手套","price":58}], "森林系列", False, 136),
    ("星空漫游套装", 0, "星空漫游者·小星", [{"id":"a13","name":"星星贴纸套装","price":28},{"id":"a20","name":"LED发光戒指","price":58}], "星空系列", True, 86),
    ("朋克公主套装", 0, "朋克公主·小酷", [{"id":"a18","name":"流苏挂件","price":38},{"id":"a20","name":"LED发光戒指","price":58}], "波西系列", True, 96),
]

USER_DATA = [
    ("13800138001", "李小姐", "北京市朝阳区", "220.181.22.*"),
    ("13800138002", "王女士", "上海市浦东新区", "116.228.88.*"),
    ("13800138003", "张妈妈", "广州市天河区", "14.215.66.*"),
    ("13800138004", "刘太太", "深圳市南山区", "183.15.88.*"),
    ("13800138005", "陈小姐", "杭州市西湖区", "60.176.88.*"),
    ("13800138006", "周女士", "南京市鼓楼区", "121.237.88.*"),
    ("13800138007", "吴妈妈", "成都市武侯区", "125.69.88.*"),
    ("13800138008", "郑小姐", "武汉市洪山区", "111.173.88.*"),
    ("13800138009", "孙女士", "西安市雁塔区", "36.152.88.*"),
    ("13800138010", "赵太太", "重庆市渝北区", "125.44.88.*"),
    ("13900139001", "钱小姐", "天津市和平区", "60.28.88.*"),
    ("13900139002", "李女士", "苏州市姑苏区", "58.208.88.*"),
    ("13900139003", "王妈妈", "长沙市岳麓区", "124.232.88.*"),
    ("13900139004", "张小姐", "郑州市金水区", "123.52.88.*"),
    ("13900139005", "刘女士", "济南市历下区", "119.162.88.*"),
    ("13900139006", "陈太太", "青岛市市南区", "58.67.88.*"),
    ("13900139007", "周小姐", "沈阳市和平区", "123.96.88.*"),
    ("13900139008", "吴女士", "大连市中山区", "60.29.88.*"),
    ("13900139009", "郑妈妈", "哈尔滨市南岗区", "219.217.88.*"),
    ("13900139010", "孙小姐", "长春市朝阳区", "124.136.88.*"),
]

INQUIRY_STATUS = ["pending", "contacted", "quoted", "closed", "cancelled"]
INQUIRY_WEIGHTS = [30, 25, 20, 15, 10]

BANNER_DATA = [
    ("新品上市 | 樱花精灵系列", "https://placehold.co/800x400/F43F5E/FFFFFF?text=Doll+New+Arrival", "", 1),
    ("国庆特惠 | 全场8折起", "https://placehold.co/800x400/3B82F6/FFFFFF?text=National+Day+Sale", "", 2),
    ("新品发布 | 公主系列限定款", "https://placehold.co/800x400/EC4899/FFFFFF?text=Princess+Limited", "", 3),
    ("秋季新品 | 森林系列温暖上市", "https://placehold.co/800x400/10B981/FFFFFF?text=Forest+Series", "", 4),
    ("圣诞狂欢 | 节日限定礼盒", "https://placehold.co/800x400/8B5CF6/FFFFFF?text=Christmas+Gift", "", 5),
]

def init_database():
    """初始化数据库表结构（如果不存在）"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            # 只确保表存在，不删除现有数据
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS series (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    type VARCHAR(20) DEFAULT 'standard',
                    status VARCHAR(20) DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS category (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS doll (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    series_id VARCHAR(36),
                    category_id VARCHAR(36),
                    price DECIMAL(10,2) DEFAULT 0,
                    cost DECIMAL(10,2) DEFAULT 0,
                    stock INT DEFAULT 0,
                    images TEXT,
                    description TEXT,
                    materials TEXT,
                    size VARCHAR(50),
                    patent_no VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'active',
                    is_featured TINYINT DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS accessory (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    category_id VARCHAR(36),
                    price DECIMAL(10,2) DEFAULT 0,
                    cost DECIMAL(10,2) DEFAULT 0,
                    stock INT DEFAULT 0,
                    images TEXT,
                    description TEXT,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS outfit_template (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    doll_id VARCHAR(36),
                    accessory_ids TEXT,
                    total_price DECIMAL(10,2) DEFAULT 0,
                    description TEXT,
                    is_hot TINYINT DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user (
                    id VARCHAR(36) PRIMARY KEY,
                    nickname VARCHAR(100),
                    phone VARCHAR(20) UNIQUE,
                    avatar VARCHAR(500),
                    region VARCHAR(100),
                    source VARCHAR(50),
                    status VARCHAR(20) DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS inquiry_order (
                    id VARCHAR(36) PRIMARY KEY,
                    order_no VARCHAR(50) UNIQUE,
                    user_id VARCHAR(36),
                    user_name VARCHAR(100),
                    user_phone VARCHAR(20),
                    doll_id VARCHAR(36),
                    doll_name VARCHAR(200),
                    accessories TEXT,
                    outfit_id VARCHAR(36),
                    outfit_name VARCHAR(200),
                    total_price DECIMAL(10,2) DEFAULT 0,
                    remark TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    admin_note TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS follow_up_record (
                    id VARCHAR(36) PRIMARY KEY,
                    inquiry_id VARCHAR(36) NOT NULL,
                    content TEXT,
                    follow_up_by VARCHAR(100),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS inventory_record (
                    id VARCHAR(36) PRIMARY KEY,
                    product_type VARCHAR(20),
                    product_id VARCHAR(36),
                    product_name VARCHAR(200),
                    type VARCHAR(20),
                    quantity INT DEFAULT 0,
                    reason VARCHAR(100),
                    operator VARCHAR(100),
                    balance_before INT DEFAULT 0,
                    balance_after INT DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS banner (
                    id VARCHAR(36) PRIMARY KEY,
                    title VARCHAR(200),
                    image VARCHAR(500),
                    link VARCHAR(500),
                    sort INT DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS system_log (
                    id VARCHAR(36) PRIMARY KEY,
                    action VARCHAR(100),
                    target_type VARCHAR(50),
                    target_id VARCHAR(36),
                    operator VARCHAR(100),
                    detail TEXT,
                    ip VARCHAR(50),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            db.commit()
        print("数据库表结构已确认")
    finally:
        db.close()

def insert_series():
    db = get_db()
    try:
        with db.cursor() as cursor:
            for name, desc, stype in SERIES_DATA:
                sid = generate_uuid()
                cursor.execute("""
                    INSERT INTO series (id, name, description, type, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, 'active', %s, %s)
                """, (sid, name, desc, stype, now(), now()))
        db.commit()
        print(f"插入 {len(SERIES_DATA)} 条系列")
    finally:
        db.close()

def insert_category():
    db = get_db()
    try:
        with db.cursor() as cursor:
            for name, val, desc in CATEGORY_DATA:
                cid = generate_uuid()
                cursor.execute("""
                    INSERT IGNORE INTO category (id, name, value, description, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, 'active', %s, %s)
                """, (cid, name, val, desc, now(), now()))
        db.commit()
        print(f"插入 {len(CATEGORY_DATA)} 条分类")
    finally:
        db.close()

def insert_doll():
    db = get_db()
    created_ids = []
    colors = ["F43F5E", "3B82F6", "10B981", "F59E0B", "8B5CF6", "EC4899"]
    try:
        with db.cursor() as cursor:
            for i, (name, price, material, size, stock, series_name, patent, desc, views, threshold) in enumerate(DOLL_DATA):
                did = generate_uuid()
                created_ids.append((did, name))
                img_url = f"https://placehold.co/400x400/{colors[i%6]}/FFFFFF?text=Doll{i+1}"
                cursor.execute("""
                    INSERT INTO doll (id, name, price, material, size, stock, status, series, patent_no, description, images, views, inquiries, low_stock_threshold, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, 'active', %s, %s, %s, %s, %s, 0, %s, %s, %s)
                """, (did, name, price, material, size, stock, series_name, patent, desc,
                      json.dumps([img_url]), views, threshold, now(), now()))
        db.commit()
        print(f"插入 {len(DOLL_DATA)} 条娃娃")
        return created_ids
    finally:
        db.close()

def insert_accessory():
    db = get_db()
    created_ids = []
    colors = ["F43F5E", "3B82F6", "10B981", "F59E0B", "8B5CF6", "EC4899"]
    try:
        with db.cursor() as cursor:
            for i, (name, cat, series_name, price, stock, desc, threshold) in enumerate(ACCESSORY_DATA):
                aid = generate_uuid()
                created_ids.append((aid, name))
                img_url = f"https://placehold.co/400x400/{colors[i%6]}/FFFFFF?text=Acc{i+1}"
                cursor.execute("""
                    INSERT INTO accessory (id, name, category, series, price, stock, status, material, description, images, applicable_dolls, views, low_stock_threshold, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, 'active', '', %s, %s, %s, 0, %s, %s, %s)
                """, (aid, name, cat, series_name, price, stock, desc,
                      json.dumps([img_url]), json.dumps([]), threshold, now(), now()))
        db.commit()
        print(f"插入 {len(ACCESSORY_DATA)} 条配饰")
        return created_ids
    finally:
        db.close()

def insert_outfit(doll_ids, acc_ids):
    db = get_db()
    colors = ["F43F5E", "3B82F6", "10B981", "F59E0B", "8B5CF6", "EC4899"]
    try:
        with db.cursor() as cursor:
            for i, (name, doll_idx, doll_name, accessories, series_name, is_hot, usage) in enumerate(OUTFIT_DATA):
                oid = generate_uuid()
                cover_url = f"https://placehold.co/400x300/{colors[i%6]}/FFFFFF?text=Outfit{i+1}"
                cursor.execute("""
                    INSERT INTO outfit_template (id, name, doll_id, doll_name, accessories, total_price, cover_image, is_hot, usage_count, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (oid, name, doll_ids[doll_idx % len(doll_ids)][0] if doll_ids else "",
                      doll_name, json.dumps(accessories), 0, cover_url,
                      1 if is_hot else 0, usage, now(), now()))
        db.commit()
        print(f"插入 {len(OUTFIT_DATA)} 条搭配方案")
    finally:
        db.close()

def insert_user():
    db = get_db()
    created_ids = []
    try:
        with db.cursor() as cursor:
            for i, (phone, nickname, region, ip) in enumerate(USER_DATA):
                uid = generate_uuid()
                created_ids.append((uid, phone))
                avatar_url = f"https://placehold.co/100x100/EC4899/FFFFFF?text={nickname[:2]}"
                inquiry_count = random.randint(1, 15)
                created = now() - datetime.timedelta(days=random.randint(1, 365))
                last_active = created + datetime.timedelta(days=random.randint(0, 30))
                cursor.execute("""
                    INSERT INTO user (id, phone, password, nickname, avatar, status, region, register_ip, inquiry_count, last_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, 'active', %s, %s, %s, %s, %s, %s)
                """, (uid, phone, md5_password("123456"), nickname, avatar_url, region, ip,
                      inquiry_count, last_active, created, now()))
        db.commit()
        print(f"插入 {len(USER_DATA)} 条用户")
        return created_ids
    finally:
        db.close()

def insert_inquiry(user_ids, doll_ids, acc_ids):
    db = get_db()
    try:
        with db.cursor() as cursor:
            for i in range(20):
                oid = generate_uuid()
                uid = user_ids[i % len(user_ids)][0]
                phone = user_ids[i % len(user_ids)][1]
                nickname = ["李小姐", "王女士", "张妈妈", "刘太太", "陈小姐"][i % 5]
                status = random.choices(INQUIRY_STATUS, weights=INQUIRY_WEIGHTS)[0]

                doll_id = doll_ids[i % len(doll_ids)][0]
                doll_name = doll_ids[i % len(doll_ids)][1]
                acc_count = random.randint(2, 5)
                selected_accs = random.sample(acc_ids, min(acc_count, len(acc_ids)))

                items = [{
                    "dollId": doll_id,
                    "dollName": doll_name,
                    "dollPrice": random.randint(600, 1300),
                    "accessories": [{"id": a[0], "name": a[1], "price": random.randint(30, 200)} for a in selected_accs],
                    "totalPrice": random.randint(800, 2000)
                }]

                total_amount = items[0]["totalPrice"]
                remark_options = ["希望尽快发货", "需要精美礼盒包装", "送给小朋友的生日礼物", "请提供更多颜色选择", "有实体店想批发", ""]
                created = now() - datetime.timedelta(days=random.randint(1, 90))
                updated = created + datetime.timedelta(days=random.randint(0, 7))
                order_no = f"XJ{created.strftime('%Y%m%d%H%M%S')}{random.randint(1000,9999)}"

                cursor.execute("""
                    INSERT INTO inquiry_order (id, order_no, user_id, user_name, user_phone, address, items, total_amount, status, remark, admin_note, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (oid, order_no, uid, nickname, phone, f"{nickname}的收货地址", json.dumps(items),
                      total_amount, status, random.choice(remark_options), "", created, updated))

                if status in ["contacted", "quoted", "closed"]:
                    follow_id = generate_uuid()
                    status_text = {'contacted': '联系', 'quoted': '报价', 'closed': '成交'}[status]
                    cursor.execute("""
                        INSERT INTO follow_up_record (id, inquiry_id, status, operator, note, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (follow_id, oid, status, "admin", f"已{status_text}", updated))
        db.commit()
        print("插入 20 条询价订单")
    finally:
        db.close()

def insert_inventory_records():
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("(SELECT id, name, stock, 'doll' as ptype FROM doll LIMIT 5) UNION (SELECT id, name, stock, 'accessory' as ptype FROM accessory LIMIT 5)")
            products = cursor.fetchall()
            for i, p in enumerate(products):
                record_id = generate_uuid()
                record_type = random.choice(["in", "out"])
                qty = random.randint(5, 30)
                reasons = {"in": ["生产入库", "采购入库", "退货入库"], "out": ["订单出库", "损耗出库", "盘点调整"]}
                reason = random.choice(reasons[record_type])
                before = random.randint(20, 100)
                after = before + qty if record_type == "in" else before - qty
                created = now() - datetime.timedelta(days=random.randint(1, 60))
                cursor.execute("""
                    INSERT INTO inventory_record (id, product_type, product_id, product_name, type, quantity, reason, operator, balance_before, balance_after, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (record_id, p[3], p[0], p[1], record_type, qty, reason, "admin", before, after, created))
        db.commit()
        print("插入库存记录")
    finally:
        db.close()

def insert_banners():
    db = get_db()
    try:
        with db.cursor() as cursor:
            for title, img, link, sort_order in BANNER_DATA:
                bid = generate_uuid()
                cursor.execute("""
                    INSERT INTO banner (id, title, image, link, sort, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, 'active', %s, %s)
                """, (bid, title, img, link, sort_order, now(), now()))
        db.commit()
        print(f"插入 {len(BANNER_DATA)} 条Banner")
    finally:
        db.close()

def insert_system_logs():
    db = get_db()
    try:
        with db.cursor() as cursor:
            actions = [
                ("管理员登录", "admin"), ("创建娃娃商品", "admin"), ("更新配饰信息", "admin"),
                ("处理询价订单", "admin"), ("更新用户状态", "admin"), ("修改企业信息", "admin"),
                ("新增搭配方案", "admin"),
            ]
            for i in range(20):
                lid = generate_uuid()
                action, operator = random.choice(actions)
                created = now() - datetime.timedelta(days=random.randint(1, 30))
                cursor.execute("""
                    INSERT INTO system_log (id, action, operator, ip, detail, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (lid, action, operator, "127.0.0.1", f"操作：{action}", created))
        db.commit()
        print("插入 20 条系统日志")
    finally:
        db.close()

def main():
    print("开始生成测试数据...")
    init_database()
    insert_series()
    insert_category()
    doll_ids = insert_doll()
    acc_ids = insert_accessory()
    insert_outfit(doll_ids, acc_ids)
    user_ids = insert_user()
    insert_inquiry(user_ids, doll_ids, acc_ids)
    insert_inventory_records()
    insert_banners()
    insert_system_logs()
    print("\n✅ 测试数据生成完成！")
    print(f"测试账号: admin / admin123")
    print(f"经理账号: manager01 / manager123")

def main_inquiries_only():
    """仅生成询价订单的入口"""
    print("开始生成询价订单...")
    insert_only_inquiries()

def insert_only_inquiries():
    """仅插入20条询价订单（不插入其他数据）"""
    print("仅生成询价订单...")
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, phone, nickname FROM user LIMIT 20")
            users = cursor.fetchall()
            cursor.execute("SELECT id, name FROM doll LIMIT 20")
            dolls = cursor.fetchall()
            cursor.execute("SELECT id, name FROM accessory LIMIT 50")
            accessories = cursor.fetchall()
        db.commit()
    finally:
        db.close()

    if not users or not dolls:
        print("错误：数据库中缺少用户或娃娃数据")
        return

    INQUIRY_STATUS = ["pending", "contacted", "quoted", "closed"]
    INQUIRY_WEIGHTS = [40, 25, 20, 15]

    db = get_db()
    try:
        with db.cursor() as cursor:
            for i in range(20):
                oid = generate_uuid()
                user = users[i % len(users)]
                uid = user['id']
                phone = user['phone']
                nickname = user['nickname'] or ["李小姐", "王女士", "张妈妈", "刘太太", "陈小姐"][i % 5]
                status = random.choices(INQUIRY_STATUS, weights=INQUIRY_WEIGHTS)[0]

                doll = dolls[i % len(dolls)]
                doll_id = doll['id']
                doll_name = doll['name']
                acc_count = random.randint(2, 5)
                selected_accs = random.sample(accessories, min(acc_count, len(accessories)))

                items = [{
                    "dollId": doll_id,
                    "dollName": doll_name,
                    "dollPrice": random.randint(600, 1300),
                    "accessories": [{"id": a['id'], "name": a['name'], "price": random.randint(30, 200)} for a in selected_accs],
                    "totalPrice": random.randint(800, 2000)
                }]

                total_amount = items[0]["totalPrice"]
                remark_options = ["希望尽快发货", "需要精美礼盒包装", "送给小朋友的生日礼物", "请提供更多颜色选择", "有实体店想批发", ""]
                created = now() - datetime.timedelta(days=random.randint(1, 90))
                updated = created + datetime.timedelta(days=random.randint(0, 7))
                order_no = f"XJ{created.strftime('%Y%m%d%H%M%S')}{random.randint(1000,9999)}"

                cursor.execute("""
                    INSERT INTO inquiry_order (id, order_no, user_id, user_name, user_phone, address, items, total_amount, status, remark, admin_note, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (oid, order_no, uid, nickname, phone, f"{nickname}的收货地址", json.dumps(items),
                      total_amount, status, random.choice(remark_options), "", created, updated))

                if status in ["contacted", "quoted", "closed"]:
                    follow_id = generate_uuid()
                    status_text = {'contacted': '联系', 'quoted': '报价', 'closed': '成交'}[status]
                    cursor.execute("""
                        INSERT INTO follow_up_record (id, inquiry_id, status, operator, note, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (follow_id, oid, status, "admin", f"已{status_text}", updated))
        db.commit()
        print("✅ 插入 20 条询价订单完成")
    finally:
        db.close()

if __name__ == "__main__":
    main_inquiries_only()
