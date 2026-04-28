"""
海亮布娃娃定制询价管理系统 - 后端主应用
匹配前端 types/index.ts 的数据模型
"""
import os
import sys
import json
import hashlib
import datetime
import random
import string
import uuid
import re
import requests
from functools import wraps
from urllib.parse import urlencode

from flask import Flask, request, jsonify, session, send_from_directory
import pymysql
from pymysql.cursors import DictCursor

app = Flask(__name__)
app.secret_key = 'hailiang_doll_secret_key_2024'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_DOMAIN'] = None  # 设置为None，让浏览器决定
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(days=7)

# ==================== 配置 ====================
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "hailiang_doll",
    "password": "3wZzebk7GAJZDt24",
    "database": "hailiang_doll",
    "charset": "utf8mb4"
}

# 微信小程序配置（需要从微信公众平台获取）
WECHAT_MINI_APP = {
    "appid": "your_appid_here",      # 替换为你的小程序 AppID
    "secret": "your_secret_here",    # 替换为你的小程序 AppSecret
}

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ==================== 工具函数 ====================

def get_db():
    """获取数据库连接"""
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
    """MD5加密密码"""
    return hashlib.md5(password.encode()).hexdigest()


def generate_uuid():
    """生成UUID"""
    return str(uuid.uuid4())


def generate_order_no():
    """生成询价单号"""
    return "XJ" + datetime.datetime.now().strftime('%Y%m%d%H%M%S') + str(random.randint(1000, 9999))


def decrypt_wechat_phone(code):
    """通过 code 解密微信手机号（正确流程）"""
    if not code:
        return None
    if WECHAT_MINI_APP['appid'] == 'your_appid_here':
        # 开发环境未配置，返回 None
        print("[WECHAT] AppID not configured, skipping phone decrypt", flush=True)
        return None
    try:
        # 微信官方接口：用 code 换取手机号
        url = "https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token="
        # 先获取 access_token（需要用到 appid 和 secret）
        token_url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={WECHAT_MINI_APP['appid']}&secret={WECHAT_MINI_APP['secret']}"
        token_resp = requests.get(token_url, timeout=10)
        token_data = token_resp.json()
        access_token = token_data.get('access_token')
        if not access_token:
            print(f"[WECHAT] failed to get access_token: {token_data}", flush=True)
            return None
        # 用 access_token 和 code 换取手机号
        phone_url = f"https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token={access_token}"
        phone_resp = requests.post(phone_url, json={"code": code}, timeout=10)
        phone_data = phone_resp.json()
        print(f"[WECHAT] phone_data: {phone_data}", flush=True)
        if phone_data.get('errcode') == 0:
            return phone_data.get('phone_info', {}).get('phoneNumber')
        else:
            print(f"[WECHAT] get phone failed: {phone_data}", flush=True)
            return None
    except Exception as e:
        print(f"[WECHAT] decrypt phone error: {e}", flush=True)
        return None


def decrypt_wechat_phone_v2(encrypted_data, iv, code):
    """通过 encryptedData 和 iv 解密微信手机号（旧版方式）"""
    if not encrypted_data or not iv or not code:
        print("[WECHAT V2] missing params: encryptedData, iv or code", flush=True)
        return None
    if WECHAT_MINI_APP['appid'] == 'your_appid_here':
        print("[WECHAT V2] AppID not configured", flush=True)
        return None
    try:
        # 先用 code 换取 session_key
        token_url = f"https://api.weixin.qq.com/sns/jscode2session?appid={WECHAT_MINI_APP['appid']}&secret={WECHAT_MINI_APP['secret']}&js_code={code}&grant_type=authorization_code"
        token_resp = requests.get(token_url, timeout=10)
        token_data = token_resp.json()
        print(f"[WECHAT V2] jscode2session response: {token_data}", flush=True)
        session_key = token_data.get('session_key')
        if not session_key:
            print(f"[WECHAT V2] failed to get session_key: {token_data}", flush=True)
            return None
        # 使用 AES-128-CBC PKCS7 解密
        import base64
        import json
        from Crypto.Cipher import AES
        from Crypto.Util.Padding import unpad

        session_key_bytes = base64.b64decode(session_key)
        iv_bytes = base64.b64decode(iv)
        encrypted_data_bytes = base64.b64decode(encrypted_data)

        cipher = AES.new(session_key_bytes, AES.MODE_CBC, iv_bytes)
        decrypted = unpad(cipher.decrypt(encrypted_data_bytes), AES.block_size)
        data_str = decrypted.decode('utf-8')
        data_obj = json.loads(data_str)
        phone = data_obj.get('phoneNumber')
        print(f"[WECHAT V2] decrypted phone: {phone}", flush=True)
        return phone
    except Exception as e:
        print(f"[WECHAT V2] decrypt error: {e}", flush=True)
        import traceback
        traceback.print_exc(file=sys.stdout)
        return None


def admin_login_required(f):
    """后台管理员登录验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin_id = session.get('admin_id')
        print(f"DEBUG: admin_login_required - session keys: {list(session.keys())}")
        print(f"DEBUG: admin_login_required - admin_id: {admin_id}")
        if not admin_id:
            return jsonify({"code": 401, "msg": "请先登录后台"})
        return f(*args, **kwargs)
    return decorated_function


def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ==================== CORS 配置 ====================

ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
    'http://localhost:8080',  # 添加config.py中配置的前端端口
    'http://192.168.0.107:5001',
    'http://192.168.0.107',
    'https://hl.aiwisely.cn',
    'http://hl.aiwisely.cn',
]

@app.after_request
def cors(response):
    origin = request.headers.get('Origin', '')
    cookie = request.headers.get('Cookie', 'NONE')
    print(f"CORS DEBUG - Origin: '{origin}' | Path: {request.path} | Cookie: {cookie[:50] if cookie != 'NONE' else 'NONE'}...")
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response


# ==================== 后台管理员认证 ====================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """后台管理员登录"""
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')

    if not username or not password:
        return jsonify({"code": 400, "msg": "用户名和密码不能为空"})

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM admin WHERE username = %s AND password = %s AND status = 'active'",
                (username, md5_password(password))
            )
            admin = cursor.fetchone()

            if not admin:
                return jsonify({"code": 400, "msg": "用户名或密码错误"})

            cursor.execute(
                "UPDATE admin SET last_login = %s WHERE id = %s",
                (datetime.datetime.now(), admin['id'])
            )
        db.commit()

        session['admin_id'] = admin['id']
        session['admin_username'] = admin['username']
        session['admin_role'] = admin['role']
        session.permanent = True
        
        print(f"DEBUG: admin_login - session set: admin_id={admin['id']}")
        print(f"DEBUG: admin_login - session keys: {list(session.keys())}")

        response = jsonify({
            "code": 200,
            "msg": "登录成功",
            "data": {
                "id": admin['id'],
                "username": admin['username'],
                "role": admin['role'],
                "email": admin.get('email', '')
            }
        })
        
        # 确保设置cookie头
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    finally:
        db.close()


@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    """后台退出登录"""
    session.clear()
    return jsonify({"code": 200, "msg": "退出成功"})


@app.route('/api/admin/info', methods=['GET'])
@admin_login_required
def get_admin_info():
    """获取管理员信息"""
    return jsonify({
        "code": 200,
        "data": {
            "id": session.get('admin_id'),
            "username": session.get('admin_username'),
            "role": session.get('admin_role')
        }
    })


# ==================== 娃娃管理 ====================

@app.route('/api/admin/doll/list', methods=['GET'])
@admin_login_required
def admin_get_doll_list():
    """后台获取娃娃列表"""
    keyword = request.args.get('keyword', '')
    status = request.args.get('status', '')
    series = request.args.get('series', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            where = "WHERE 1=1"
            params = []
            if keyword:
                where += " AND (name LIKE %s OR series LIKE %s)"
                params.extend(['%' + keyword + '%', '%' + keyword + '%'])
            if status:
                where += " AND status = %s"
                params.append(status)
            if series:
                where += " AND series = %s"
                params.append(series)

            cursor.execute("SELECT COUNT(*) as total FROM doll " + where, params)
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute(
                "SELECT * FROM doll " + where + " ORDER BY created_at DESC LIMIT %s OFFSET %s",
                params + [page_size, offset]
            )
            dolls = cursor.fetchall()

            for doll in dolls:
                images = doll.get('images')
                if isinstance(images, str):
                    doll['images'] = json.loads(images) if images else []
                elif not isinstance(images, list):
                    doll['images'] = []
                doll['createdAt'] = doll['created_at'].strftime('%Y-%m-%d') if doll.get('created_at') else ''
                doll['updatedAt'] = doll['updated_at'].strftime('%Y-%m-%d') if doll.get('updated_at') else ''
                doll['minQuantity'] = doll.get('min_quantity', 1)
                doll['defaultAccessory'] = doll.get('default_accessory') or ''
                doll['isHot'] = bool(doll.get('is_hot'))
                doll['smallBoxCapacity'] = doll.get('small_box_capacity') or 0
                doll['mediumBoxCapacity'] = doll.get('medium_box_capacity') or 0
                doll['largeBoxCapacity'] = doll.get('large_box_capacity') or 0
                selected_acc = doll.get('selected_accessories')
                if isinstance(selected_acc, str):
                    doll['selectedAccessories'] = json.loads(selected_acc) if selected_acc else []
                elif isinstance(selected_acc, list):
                    doll['selectedAccessories'] = selected_acc
                else:
                    doll['selectedAccessories'] = []

            return jsonify({"code": 200, "data": dolls, "total": total, "page": page, "page_size": page_size})
    finally:
        db.close()


@app.route('/api/admin/doll/create', methods=['POST'])
@admin_login_required
def admin_create_doll():
    """后台创建娃娃"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            doll_id = generate_uuid()
            cursor.execute("""
                INSERT INTO doll (id, name, price, material, size, stock, status, series, patent_no, description, images, views, inquiries, low_stock_threshold, min_quantity, default_accessory, selected_accessories, small_box_capacity, medium_box_capacity, large_box_capacity)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 0, %s, %s, %s, %s, %s, %s, %s)
            """, (
                doll_id,
                data.get('name', ''),
                data.get('price', 0),
                data.get('material', ''),
                data.get('size', ''),
                data.get('stock', 0),
                data.get('status', 'active'),
                data.get('series', ''),
                data.get('patentNo', ''),
                data.get('description', ''),
                json.dumps(data.get('images', [])),
                data.get('lowStockThreshold', 10),
                data.get('minQuantity', 1),
                data.get('defaultAccessory', ''),
                json.dumps(data.get('selectedAccessories', [])),
                data.get('smallBoxCapacity', 0),
                data.get('mediumBoxCapacity', 0),
                data.get('largeBoxCapacity', 0)
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "创建成功", "data": {"id": doll_id}})
    finally:
        db.close()


@app.route('/api/admin/doll/update', methods=['POST'])
@admin_login_required
def admin_update_doll():
    """后台更新娃娃"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                UPDATE doll SET name=%s, price=%s, material=%s, size=%s, stock=%s, status=%s,
                series=%s, patent_no=%s, description=%s, images=%s, low_stock_threshold=%s, min_quantity=%s, default_accessory=%s, selected_accessories=%s,
                small_box_capacity=%s, medium_box_capacity=%s, large_box_capacity=%s
                WHERE id=%s
            """, (
                data.get('name', ''),
                data.get('price', 0),
                data.get('material', ''),
                data.get('size', ''),
                data.get('stock', 0),
                data.get('status', 'active'),
                data.get('series', ''),
                data.get('patentNo', ''),
                data.get('description', ''),
                json.dumps(data.get('images', [])),
                data.get('lowStockThreshold', 10),
                data.get('minQuantity', 1),
                data.get('defaultAccessory', ''),
                json.dumps(data.get('selectedAccessories', [])),
                data.get('smallBoxCapacity', 0),
                data.get('mediumBoxCapacity', 0),
                data.get('largeBoxCapacity', 0),
                data.get('id')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()


@app.route('/api/admin/doll/delete', methods=['POST'])
@admin_login_required
def admin_delete_doll():
    """后台删除娃娃"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM doll WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "删除成功"})
    finally:
        db.close()


@app.route('/api/admin/doll/toggle-status', methods=['POST'])
@admin_login_required
def admin_toggle_doll_status():
    """切换娃娃状态（上架/下架）"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE doll SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "状态已更新"})
    finally:
        db.close()


# ==================== 配饰管理 ====================

@app.route('/api/admin/accessory/list', methods=['GET'])
@admin_login_required
def admin_get_accessory_list():
    """后台获取配饰列表"""
    keyword = request.args.get('keyword', '')
    category = request.args.get('category', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            where = "WHERE 1=1"
            params = []
            if keyword:
                where += " AND name LIKE %s"
                params.append('%' + keyword + '%')
            if category and category != 'all':
                where += " AND category = %s"
                params.append(category)

            cursor.execute("SELECT COUNT(*) as total FROM accessory " + where, params)
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute(
                "SELECT * FROM accessory " + where + " ORDER BY created_at DESC LIMIT %s OFFSET %s",
                params + [page_size, offset]
            )
            accessories = cursor.fetchall()

            for acc in accessories:
                images = acc.get('images')
                if isinstance(images, str):
                    acc['images'] = json.loads(images) if images else []
                elif not isinstance(images, list):
                    acc['images'] = []
                applicable = acc.get('applicable_dolls')
                if isinstance(applicable, str):
                    acc['applicableDolls'] = json.loads(applicable) if applicable else []
                elif not isinstance(applicable, list):
                    acc['applicableDolls'] = []
                else:
                    acc['applicableDolls'] = applicable or []
                acc['createdAt'] = acc['created_at'].strftime('%Y-%m-%d') if acc.get('created_at') else ''

            return jsonify({"code": 200, "data": accessories, "total": total, "page": page, "page_size": page_size})
    finally:
        db.close()


@app.route('/api/admin/accessory/create', methods=['POST'])
@admin_login_required
def admin_create_accessory():
    """后台创建配饰"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            acc_id = generate_uuid()
            cursor.execute("""
                INSERT INTO accessory (id, name, category, series, price, stock, status, material, description, images, applicable_dolls, views, low_stock_threshold)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, %s)
            """, (
                acc_id,
                data.get('name', ''),
                data.get('category', 'headwear'),
                data.get('series', ''),
                data.get('price', 0),
                data.get('stock', 0),
                data.get('status', 'active'),
                data.get('material', ''),
                data.get('description', ''),
                json.dumps(data.get('images', [])),
                json.dumps(data.get('applicableDolls', [])),
                data.get('lowStockThreshold', 20)
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "创建成功", "data": {"id": acc_id}})
    finally:
        db.close()


@app.route('/api/admin/accessory/update', methods=['POST'])
@admin_login_required
def admin_update_accessory():
    """后台更新配饰"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                UPDATE accessory SET name=%s, category=%s, series=%s, price=%s, stock=%s, status=%s,
                material=%s, description=%s, images=%s, applicable_dolls=%s, low_stock_threshold=%s
                WHERE id=%s
            """, (
                data.get('name', ''),
                data.get('category', 'headwear'),
                data.get('series', ''),
                data.get('price', 0),
                data.get('stock', 0),
                data.get('status', 'active'),
                data.get('material', ''),
                data.get('description', ''),
                json.dumps(data.get('images', [])),
                json.dumps(data.get('applicableDolls', [])),
                data.get('lowStockThreshold', 20),
                data.get('id')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()


@app.route('/api/admin/accessory/delete', methods=['POST'])
@admin_login_required
def admin_delete_accessory():
    """后台删除配饰"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM accessory WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "删除成功"})
    finally:
        db.close()


@app.route('/api/admin/accessory/toggle-status', methods=['POST'])
@admin_login_required
def admin_toggle_accessory_status():
    """切换配饰状态"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE accessory SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "状态已更新"})
    finally:
        db.close()


# ==================== 系列管理 ====================

@app.route('/api/admin/series/list', methods=['GET'])
@admin_login_required
def admin_get_series_list():
    """获取系列列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM series ORDER BY created_at DESC")
            series_list = cursor.fetchall()
            for s in series_list:
                s['createdAt'] = s['created_at'].strftime('%Y-%m-%d') if s.get('created_at') else ''
            return jsonify({"code": 200, "data": series_list})
    finally:
        db.close()


@app.route('/api/admin/series/create', methods=['POST'])
@admin_login_required
def admin_create_series():
    """创建系列"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            series_id = generate_uuid()
            cursor.execute("""
                INSERT INTO series (id, name, description, type, status)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                series_id,
                data.get('name', ''),
                data.get('description', ''),
                data.get('type', 'doll'),
                data.get('status', 'active')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "创建成功", "data": {"id": series_id}})
    finally:
        db.close()


@app.route('/api/admin/series/update', methods=['POST'])
@admin_login_required
def admin_update_series():
    """更新系列"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                UPDATE series SET name=%s, description=%s, type=%s, status=%s
                WHERE id=%s
            """, (
                data.get('name', ''),
                data.get('description', ''),
                data.get('type', 'doll'),
                data.get('status', 'active'),
                data.get('id')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()


@app.route('/api/admin/series/delete', methods=['POST'])
@admin_login_required
def admin_delete_series():
    """删除系列"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM series WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "删除成功"})
    finally:
        db.close()


# ==================== 分类管理 ====================

@app.route('/api/admin/category/list', methods=['GET'])
@admin_login_required
def admin_get_category_list():
    """获取分类列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM category ORDER BY created_at DESC")
            categories = cursor.fetchall()
            for c in categories:
                c['createdAt'] = c['created_at'].strftime('%Y-%m-%d') if c.get('created_at') else ''
            return jsonify({"code": 200, "data": categories})
    finally:
        db.close()


@app.route('/api/admin/category/create', methods=['POST'])
@admin_login_required
def admin_create_category():
    """创建分类"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cat_id = generate_uuid()
            cursor.execute("""
                INSERT INTO category (id, name, value, description, status)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                cat_id,
                data.get('name', ''),
                data.get('value', ''),
                data.get('description', ''),
                data.get('status', 'active')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "创建成功", "data": {"id": cat_id}})
    finally:
        db.close()


@app.route('/api/admin/category/update', methods=['POST'])
@admin_login_required
def admin_update_category():
    """更新分类"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                UPDATE category SET name=%s, value=%s, description=%s, status=%s
                WHERE id=%s
            """, (
                data.get('name', ''),
                data.get('value', ''),
                data.get('description', ''),
                data.get('status', 'active'),
                data.get('id')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()


@app.route('/api/admin/category/delete', methods=['POST'])
@admin_login_required
def admin_delete_category():
    """删除分类"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM category WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "删除成功"})
    finally:
        db.close()


# ==================== 搭配方案管理 ====================

@app.route('/api/admin/outfit/list', methods=['GET'])
@admin_login_required
def admin_get_outfit_list():
    """获取搭配方案列表"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 15, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total FROM outfit_template")
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute("""
                SELECT o.*, d.series as doll_series
                FROM outfit_template o
                LEFT JOIN doll d ON o.doll_id = d.id
                ORDER BY o.created_at DESC LIMIT %s OFFSET %s
            """, [page_size, offset])
            outfits = cursor.fetchall()
            for o in outfits:
                accessories = o.get('accessories')
                if isinstance(accessories, str):
                    o['accessories'] = json.loads(accessories) if accessories else []
                elif not isinstance(accessories, list):
                    o['accessories'] = []
                o['dollId'] = o.get('doll_id', '')
                o['dollName'] = o.get('doll_name', '')
                o['dollSeries'] = o.get('doll_series', '') or ''
                o['totalPrice'] = float(o.get('total_price') or 0)
                o['createdAt'] = o['created_at'].strftime('%Y-%m-%d') if o.get('created_at') else ''
                o['isHot'] = bool(o.get('is_hot'))
                o['usageCount'] = o.get('usage_count', 0)
                o['coverImage'] = o.get('cover_image', '')
            return jsonify({"code": 200, "data": outfits, "total": total, "page": page, "page_size": page_size})
    finally:
        db.close()


@app.route('/api/admin/outfit/create', methods=['POST'])
@admin_login_required
def admin_create_outfit():
    """创建搭配方案"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            outfit_id = generate_uuid()
            cursor.execute("""
                INSERT INTO outfit_template (id, name, doll_id, doll_name, accessories, total_price, cover_image, is_hot, usage_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0)
            """, (
                outfit_id,
                data.get('name', ''),
                data.get('dollId', ''),
                data.get('dollName', ''),
                json.dumps(data.get('accessories', [])),
                data.get('totalPrice', 0),
                data.get('coverImage', ''),
                1 if data.get('isHot') else 0
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "创建成功", "data": {"id": outfit_id}})
    finally:
        db.close()


@app.route('/api/admin/outfit/update', methods=['POST'])
@admin_login_required
def admin_update_outfit():
    """更新搭配方案"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                UPDATE outfit_template SET name=%s, doll_id=%s, doll_name=%s, accessories=%s,
                total_price=%s, cover_image=%s, is_hot=%s
                WHERE id=%s
            """, (
                data.get('name', ''),
                data.get('dollId', ''),
                data.get('dollName', ''),
                json.dumps(data.get('accessories', [])),
                data.get('totalPrice', 0),
                data.get('coverImage', ''),
                1 if data.get('isHot') else 0,
                data.get('id')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()


@app.route('/api/admin/outfit/delete', methods=['POST'])
@admin_login_required
def admin_delete_outfit():
    """删除搭配方案"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM outfit_template WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "删除成功"})
    finally:
        db.close()


@app.route('/api/admin/outfit/toggle-hot', methods=['POST'])
@admin_login_required
def admin_toggle_outfit_hot():
    """切换热门状态"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE outfit_template SET is_hot = CASE WHEN is_hot = 1 THEN 0 ELSE 1 END WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "已更新"})
    finally:
        db.close()


# ==================== 询价订单管理 ====================

@app.route('/api/admin/inquiry/list', methods=['GET'])
@admin_login_required
def admin_get_inquiry_list():
    """获取询价单列表"""
    status = request.args.get('status', '')
    keyword = request.args.get('keyword', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            where = "WHERE 1=1"
            params = []
            if status and status != 'all':
                where += " AND status = %s"
                params.append(status)
            if keyword:
                where += " AND (order_no LIKE %s OR user_name LIKE %s OR user_phone LIKE %s)"
                params.extend(['%' + keyword + '%', '%' + keyword + '%', '%' + keyword + '%'])

            cursor.execute("SELECT COUNT(*) as total FROM inquiry_order " + where, params)
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute(
                "SELECT * FROM inquiry_order " + where + " ORDER BY created_at DESC LIMIT %s OFFSET %s",
                params + [page_size, offset]
            )
            orders = cursor.fetchall()

            for order in orders:
                if isinstance(order.get('items'), str):
                    order['items'] = json.loads(order['items']) if order['items'] else []
                order['createdAt'] = order['created_at'].strftime('%Y-%m-%d %H:%M') if order.get('created_at') else ''
                order['updatedAt'] = order['updated_at'].strftime('%Y-%m-%d %H:%M') if order.get('updated_at') else ''
                order['orderNo'] = order.get('order_no', '')
                order['userName'] = order.get('user_name', '')
                order['userPhone'] = order.get('user_phone', '')
                order['address'] = order.get('address', '')
                order['adminNote'] = order.get('admin_note', '')
                order['totalAmount'] = float(order.get('total_amount') or 0)
                order['isPindan'] = order.get('is_pindan', 0) == 1

            return jsonify({"code": 200, "data": orders, "total": total, "page": page, "page_size": page_size})
    finally:
        db.close()


@app.route('/api/admin/inquiry/detail/<inquiry_id>', methods=['GET'])
@admin_login_required
def admin_get_inquiry_detail(inquiry_id):
    """获取询价单详情"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM inquiry_order WHERE id = %s", (inquiry_id,))
            order = cursor.fetchone()

            if not order:
                return jsonify({"code": 404, "msg": "询价单不存在"})

            if isinstance(order.get('items'), str):
                order['items'] = json.loads(order['items']) if order['items'] else []

            cursor.execute("SELECT * FROM follow_up_record WHERE inquiry_id = %s ORDER BY created_at DESC", (inquiry_id,))
            records = cursor.fetchall()
            for r in records:
                r['time'] = r['created_at'].strftime('%Y-%m-%d %H:%M') if r.get('created_at') else ''
                r['id'] = r['id']
                r['status'] = r['status']
                r['operator'] = r['operator']
                r['note'] = r.get('note', '')

            order['followUpRecords'] = records
            order['createdAt'] = order['created_at'].strftime('%Y-%m-%d %H:%M') if order.get('created_at') else ''
            order['updatedAt'] = order['updated_at'].strftime('%Y-%m-%d %H:%M') if order.get('updated_at') else ''
            order['orderNo'] = order.get('order_no', '')
            order['userName'] = order.get('user_name', '')
            order['userPhone'] = order.get('user_phone', '')
            order['address'] = order.get('address', '')
            order['adminNote'] = order.get('admin_note', '')
            order['totalAmount'] = float(order.get('total_amount') or 0)
            order['isPindan'] = order.get('is_pindan', 0) == 1

            return jsonify({"code": 200, "data": order})
    finally:
        db.close()


@app.route('/api/admin/inquiry/update-status', methods=['POST'])
@admin_login_required
def admin_update_inquiry_status():
    """更新询价单状态"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            inquiry_id = data.get('id')
            new_status = data.get('status')
            admin_note = data.get('adminNote', '')

            cursor.execute("""
                UPDATE inquiry_order SET status=%s, admin_note=%s WHERE id=%s
            """, (new_status, admin_note, inquiry_id))

            follow_id = generate_uuid()
            cursor.execute("""
                INSERT INTO follow_up_record (id, inquiry_id, status, operator, note)
                VALUES (%s, %s, %s, %s, %s)
            """, (follow_id, inquiry_id, new_status, session.get('admin_username', '管理员'), admin_note))

        db.commit()
        return jsonify({"code": 200, "msg": "状态已更新"})
    finally:
        db.close()


@app.route('/api/admin/inquiry/follow-up/<inquiry_id>', methods=['GET'])
@admin_login_required
def admin_get_follow_up_records(inquiry_id):
    """获取跟进记录"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM follow_up_record WHERE inquiry_id = %s ORDER BY created_at DESC",
                (inquiry_id,)
            )
            records = cursor.fetchall()
            for r in records:
                r['time'] = r['created_at'].strftime('%Y-%m-%d %H:%M') if r.get('created_at') else ''
                r['id'] = r['id']
            return jsonify({"code": 200, "data": records})
    finally:
        db.close()


# ==================== 用户管理 ====================

@app.route('/api/admin/user/list', methods=['GET'])
@admin_login_required
def admin_get_user_list():
    """获取用户列表"""
    keyword = request.args.get('keyword', '')
    status = request.args.get('status', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            where = "WHERE 1=1"
            params = []
            if keyword:
                where += " AND (phone LIKE %s OR nickname LIKE %s OR region LIKE %s)"
                params.extend(['%' + keyword + '%', '%' + keyword + '%', '%' + keyword + '%'])
            if status and status != 'all':
                where += " AND status = %s"
                params.append(status)

            cursor.execute("SELECT COUNT(*) as total FROM user " + where, params)
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute(
                "SELECT * FROM user " + where + " ORDER BY created_at DESC LIMIT %s OFFSET %s",
                params + [page_size, offset]
            )
            users = cursor.fetchall()

            for u in users:
                u['createdAt'] = u['created_at'].strftime('%Y-%m-%d') if u.get('created_at') else ''
                u['lastActive'] = u['last_active'].strftime('%Y-%m-%d') if u.get('last_active') else ''
                u['registerIp'] = u.get('register_ip', '')

            return jsonify({"code": 200, "data": users, "total": total, "page": page, "page_size": page_size})
    finally:
        db.close()


@app.route('/api/admin/user/toggle-status', methods=['POST'])
@admin_login_required
def admin_toggle_user_status():
    """切换用户状态"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE user SET status = CASE WHEN status = 'active' THEN 'disabled' ELSE 'active' END WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "状态已更新"})
    finally:
        db.close()


@app.route('/api/admin/user/create', methods=['POST'])
@admin_login_required
def admin_create_user():
    """创建用户"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            user_id = generate_uuid()
            cursor.execute("""
                INSERT INTO user (id, phone, nickname, avatar, status, region, register_ip, created_at, last_active, inquiry_count)
                VALUES (%s, %s, %s, %s, 'active', %s, %s, NOW(), NOW(), 0)
            """, (user_id, data.get('phone', ''), data.get('nickname', ''), data.get('avatar', ''), data.get('region', ''), data.get('registerIp', '')))
            db.commit()
            return jsonify({"code": 200, "msg": "创建成功", "data": {"id": user_id}})
    finally:
        db.close()


@app.route('/api/admin/user/update', methods=['POST'])
@admin_login_required
def admin_update_user():
    """更新用户"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            updates = []
            params = []
            if 'nickname' in data:
                updates.append("nickname=%s")
                params.append(data['nickname'])
            if 'phone' in data:
                updates.append("phone=%s")
                params.append(data['phone'])
            if 'region' in data:
                updates.append("region=%s")
                params.append(data['region'])
            if 'avatar' in data:
                updates.append("avatar=%s")
                params.append(data['avatar'])
            if 'status' in data:
                updates.append("status=%s")
                params.append(data['status'])

            if updates:
                params.append(data['id'])
                cursor.execute(f"UPDATE user SET {','.join(updates)} WHERE id=%s", params)
                db.commit()
            return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()


@app.route('/api/admin/user/delete', methods=['POST'])
@admin_login_required
def admin_delete_user():
    """删除用户"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM user WHERE id=%s", (data.get('id'),))
            db.commit()
            return jsonify({"code": 200, "msg": "删除成功"})
    finally:
        db.close()


# ==================== 库存管理 ====================

@app.route('/api/admin/inventory/overview', methods=['GET'])
@admin_login_required
def admin_get_inventory_overview():
    """获取库存概览"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM doll WHERE status='active'")
            doll_count = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM accessory WHERE status='active'")
            acc_count = cursor.fetchone()['count']

            cursor.execute("SELECT COALESCE(SUM(stock), 0) as total FROM doll WHERE status='active'")
            doll_stock = cursor.fetchone()['total']

            cursor.execute("SELECT COALESCE(SUM(stock), 0) as total FROM accessory WHERE status='active'")
            acc_stock = cursor.fetchone()['total']

            cursor.execute("SELECT COUNT(*) as count FROM doll WHERE stock <= low_stock_threshold AND status='active'")
            low_doll = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM accessory WHERE stock <= low_stock_threshold AND status='active'")
            low_acc = cursor.fetchone()['count']

            return jsonify({
                "code": 200,
                "data": {
                    "dollCount": doll_count,
                    "accessoryCount": acc_count,
                    "dollStock": int(doll_stock),
                    "accessoryStock": int(acc_stock),
                    "lowStockDolls": low_doll,
                    "lowStockAccessories": low_acc
                }
            })
    finally:
        db.close()


@app.route('/api/admin/inventory/products', methods=['GET'])
@admin_login_required
def admin_get_inventory_products():
    """获取库存商品列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, 'doll' as type, stock, low_stock_threshold, series, '娃娃' as type_name
                FROM doll WHERE status='active'
                UNION ALL
                SELECT id, name, 'accessory' as type, stock, low_stock_threshold, category as series, '配饰' as type_name
                FROM accessory WHERE status='active'
                ORDER BY stock ASC
            """)
            products = cursor.fetchall()
            return jsonify({"code": 200, "data": products})
    finally:
        db.close()


@app.route('/api/admin/inventory/records', methods=['GET'])
@admin_login_required
def admin_get_inventory_records():
    """获取库存记录"""
    filter_type = request.args.get('type', 'all')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            where = "WHERE 1=1"
            params = []
            if filter_type != 'all':
                where += " AND type = %s"
                params.append(filter_type)

            cursor.execute("SELECT COUNT(*) as total FROM inventory_record " + where, params)
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute(
                "SELECT * FROM inventory_record " + where + " ORDER BY created_at DESC LIMIT %s OFFSET %s",
                params + [page_size, offset]
            )
            records = cursor.fetchall()

            for r in records:
                r['createdAt'] = r['created_at'].strftime('%Y-%m-%d') if r.get('created_at') else ''

            return jsonify({"code": 200, "data": records, "total": total})
    finally:
        db.close()


@app.route('/api/admin/inventory/add-record', methods=['POST'])
@admin_login_required
def admin_add_inventory_record():
    """新增库存记录"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            product_type = data.get('productType')
            product_id = data.get('productId')

            table = 'doll' if product_type == 'doll' else 'accessory'
            cursor.execute(f"SELECT name, stock FROM {table} WHERE id = %s", (product_id,))
            product = cursor.fetchone()
            if not product:
                return jsonify({"code": 404, "msg": "商品不存在"})

            balance_before = product['stock']
            change_type = data.get('type')
            quantity = data.get('quantity', 0)

            if change_type == 'out':
                quantity = -abs(quantity)

            balance_after = balance_before + quantity

            if balance_after < 0:
                return jsonify({"code": 400, "msg": "库存不足"})

            cursor.execute(f"UPDATE {table} SET stock = %s WHERE id = %s", (balance_after, product_id))

            record_id = generate_uuid()
            cursor.execute("""
                INSERT INTO inventory_record (id, product_type, product_id, product_name, type, quantity, reason, operator, balance_before, balance_after)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                record_id,
                product_type,
                product_id,
                product['name'],
                change_type,
                abs(quantity),
                data.get('reason', ''),
                session.get('admin_username', '管理员'),
                balance_before,
                balance_after
            ))

        db.commit()
        return jsonify({"code": 200, "msg": "记录已添加"})
    finally:
        db.close()


# ==================== 数据报表 ====================

@app.route('/api/admin/report/dashboard', methods=['GET'])
@admin_login_required
def admin_get_dashboard_stats():
    """获取控制台统计数据"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            today = datetime.date.today()
            yesterday = today - datetime.timedelta(days=1)

            cursor.execute("""
                SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
                FROM inquiry_order
                WHERE DATE(created_at) = %s
            """, (today,))
            today_data = cursor.fetchone()

            cursor.execute("""
                SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
                FROM inquiry_order
                WHERE DATE(created_at) = %s
            """, (yesterday,))
            yesterday_data = cursor.fetchone()

            # 计算今日环比
            today_amount = float(today_data['amount'])
            yesterday_amount = float(yesterday_data['amount'])
            if yesterday_amount > 0:
                today_amount_trend = round(((today_amount - yesterday_amount) / yesterday_amount) * 100, 2)
            else:
                today_amount_trend = 0

            cursor.execute("""
                SELECT id, order_no, user_name, user_phone, total_amount, status
                FROM inquiry_order WHERE status = 'pending'
                ORDER BY created_at DESC LIMIT 5
            """)
            pending_orders = cursor.fetchall()
            for o in pending_orders:
                o['orderNo'] = o.get('order_no', '')
                o['userName'] = o.get('user_name', '')
                o['userPhone'] = o.get('user_phone', '')
                o['totalAmount'] = float(o.get('total_amount') or 0)

            # 今日新增待处理询价
            cursor.execute("""
                SELECT COUNT(*) as count FROM inquiry_order
                WHERE status = 'pending' AND DATE(created_at) = %s
            """, (today,))
            today_pending = cursor.fetchone()['count']

            # 昨日新增待处理询价
            cursor.execute("""
                SELECT COUNT(*) as count FROM inquiry_order
                WHERE status = 'pending' AND DATE(created_at) = %s
            """, (yesterday,))
            yesterday_pending = cursor.fetchone()['count']

            # 计算待处理环比
            if yesterday_pending > 0:
                pending_trend = round(((today_pending - yesterday_pending) / yesterday_pending) * 100, 2)
            else:
                pending_trend = 0

            cursor.execute("SELECT COUNT(*) as count FROM user")
            total_users = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM inquiry_order")
            total_inquiries = cursor.fetchone()['count']

            cursor.execute("""
                SELECT id, name, series, stock, images
                FROM doll WHERE stock <= low_stock_threshold AND status='active'
                ORDER BY stock ASC LIMIT 5
            """)
            low_dolls = cursor.fetchall()
            for d in low_dolls:
                images = d.get('images')
                if isinstance(images, str):
                    d['images'] = json.loads(images) if images else []
                elif not isinstance(images, list):
                    d['images'] = []

            cursor.execute("SELECT COUNT(*) as count FROM doll WHERE status='active'")
            active_dolls = cursor.fetchone()['count']

            cursor.execute("""
                SELECT COUNT(*) as count FROM user
                WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
            """)
            monthly_users = cursor.fetchone()['count']

            # 上月用户数
            last_month_start = (datetime.date.today().replace(day=1) - datetime.timedelta(days=1)).replace(day=1)
            cursor.execute("""
                SELECT COUNT(*) as count FROM user
                WHERE created_at >= %s AND created_at < DATE_FORMAT(CURDATE(), '%%Y-%%m-01')
            """, (last_month_start,))
            last_month_users = cursor.fetchone()['count']

            # 计算用户环比
            if last_month_users > 0:
                user_trend = round(((monthly_users - last_month_users) / last_month_users) * 100, 2)
            else:
                user_trend = 0

            return jsonify({
                "code": 200,
                "data": {
                    "todayInquiries": today_data['count'],
                    "todayAmount": today_amount,
                    "todayAmountTrend": today_amount_trend,
                    "pendingTrend": pending_trend,
                    "userTrend": user_trend,
                    "inquiryTrend": 0,
                    "pendingInquiries": pending_orders,
                    "totalUsers": total_users,
                    "totalInquiries": total_inquiries,
                    "lowStockDolls": low_dolls,
                    "activeDolls": active_dolls,
                    "monthlyUsers": monthly_users
                }
            })
    finally:
        db.close()


@app.route('/api/admin/report/chart-data', methods=['GET'])
@admin_login_required
def admin_get_chart_data():
    """获取图表数据"""
    days = request.args.get('days', 365, type=int)  # 默认查询1年数据
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
                FROM inquiry_order
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
                GROUP BY DATE(created_at)
                ORDER BY date
            """, (days,))
            daily = cursor.fetchall()
            for d in daily:
                d['date'] = d['date'].strftime('%m-%d') if d.get('date') else ''
                d['amount'] = float(d['amount'])

            cursor.execute("""
                SELECT category, COUNT(*) as count FROM accessory
                WHERE status='active' GROUP BY category
            """)
            accessory_usage = cursor.fetchall()
            # 映射 category 到 name
            cat_map = {'headwear': '头饰', 'clothing': '衣服', 'shoes': '鞋子', 'props': '道具', 'giftbox': '礼盒'}
            for a in accessory_usage:
                a['name'] = cat_map.get(a.get('category', ''), a.get('category', ''))

            cursor.execute("""
                SELECT name, views FROM doll WHERE status='active' ORDER BY views DESC LIMIT 10
            """)
            doll_views = cursor.fetchall()

            cursor.execute("""
                SELECT DATE_FORMAT(created_at, '%%Y-%%m-%%d') as month, COUNT(*) as count
                FROM user
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%%Y-%%m-%%d')
                ORDER BY month
            """)
            user_registrations = cursor.fetchall()
            for r in user_registrations:
                r['month'] = r.get('month', '')

            # 地区分布数据
            cursor.execute("""
                SELECT region as region, COUNT(*) as count
                FROM user WHERE region != '' AND region IS NOT NULL
                GROUP BY region ORDER BY count DESC
            """)
            region_data = cursor.fetchall()

            # 总用户数
            cursor.execute("SELECT COUNT(*) as count FROM user")
            total_users = cursor.fetchone()['count']

            # 活跃用户数
            cursor.execute("SELECT COUNT(*) as count FROM user WHERE status='active'")
            active_users = cursor.fetchone()['count']

            # 月新增用户
            cursor.execute("""
                SELECT COUNT(*) as count FROM user
                WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
            """)
            monthly_new_users = cursor.fetchone()['count']

            return jsonify({
                "code": 200,
                "data": {
                    "dailyInquiries": daily,
                    "accessoryUsage": accessory_usage,
                    "dollViews": doll_views,
                    "userRegistrations": user_registrations,
                    "regionData": region_data,
                    "totalUsers": total_users,
                    "activeUsers": active_users,
                    "monthlyNewUsers": monthly_new_users
                }
            })
    finally:
        db.close()


# ==================== 企业信息管理 ====================

@app.route('/api/admin/company/info', methods=['GET', 'POST'])
@admin_login_required
def admin_company_info():
    """获取/更新企业信息"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            if request.method == 'GET':
                cursor.execute("SELECT * FROM company_info LIMIT 1")
                info = cursor.fetchone()
                if info:
                    info['workHours'] = info.get('work_hours', '')
                    info['mapLng'] = info.get('map_lng', '')
                    info['mapLat'] = info.get('map_lat', '')
                return jsonify({"code": 200, "data": info or {}})
            else:
                data = request.get_json()
                cursor.execute("SELECT id FROM company_info LIMIT 1")
                existing = cursor.fetchone()

                if existing:
                    cursor.execute("""
                        UPDATE company_info SET name=%s, slogan=%s, phone=%s, address=%s, work_hours=%s,
                        email=%s, description=%s, map_lng=%s, map_lat=%s
                        WHERE id=%s
                    """, (
                        data.get('name', ''),
                        data.get('slogan', ''),
                        data.get('phone', ''),
                        data.get('address', ''),
                        data.get('workHours', ''),
                        data.get('email', ''),
                        data.get('description', ''),
                        data.get('mapLng', ''),
                        data.get('mapLat', ''),
                        existing['id']
                    ))
                else:
                    cursor.execute("""
                        INSERT INTO company_info (name, slogan, phone, address, work_hours, email, description, map_lng, map_lat)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        data.get('name', ''),
                        data.get('slogan', ''),
                        data.get('phone', ''),
                        data.get('address', ''),
                        data.get('workHours', ''),
                        data.get('email', ''),
                        data.get('description', ''),
                        data.get('mapLng', ''),
                        data.get('mapLat', '')
                    ))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()

# ==================== 资质证书管理 ====================

@app.route('/api/admin/certificate/list', methods=['GET'])
@admin_login_required
def admin_certificate_list():
    """获取资质证书列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM certificate ORDER BY sort DESC, created_at DESC")
            certs = cursor.fetchall()
            return jsonify({"code": 200, "data": certs})
    finally:
        db.close()

@app.route('/api/admin/certificate/create', methods=['POST'])
@admin_login_required
def admin_certificate_create():
    """添加资质证书"""
    data = request.get_json()
    cert_id = generate_uuid()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                INSERT INTO certificate (id, name, image, sort, status)
                VALUES (%s, %s, %s, %s, 'active')
            """, (cert_id, data.get('name', ''), data.get('image', ''), data.get('sort', 0)))
        db.commit()
        return jsonify({"code": 200, "msg": "添加成功", "data": {"id": cert_id}})
    finally:
        db.close()

@app.route('/api/admin/certificate/update', methods=['POST'])
@admin_login_required
def admin_certificate_update():
    """更新资质证书"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                UPDATE certificate SET name=%s, image=%s, sort=%s, status=%s WHERE id=%s
            """, (data.get('name', ''), data.get('image', ''), data.get('sort', 0), data.get('status', 'active'), data.get('id', '')))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()

@app.route('/api/admin/certificate/delete', methods=['POST'])
@admin_login_required
def admin_certificate_delete():
    """删除资质证书"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM certificate WHERE id=%s", (data.get('id', ''),))
        db.commit()
        return jsonify({"code": 200, "msg": "删除成功"})
    finally:
        db.close()


# ==================== Banner管理 ====================

@app.route('/api/admin/banner/list', methods=['GET'])
@admin_login_required
def admin_get_banner_list():
    """获取Banner列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM banner ORDER BY sort DESC, created_at DESC")
            banners = cursor.fetchall()
            for b in banners:
                b['createdAt'] = b['created_at'].strftime('%Y-%m-%d') if b.get('created_at') else ''
            return jsonify({"code": 200, "data": banners})
    finally:
        db.close()


@app.route('/api/admin/banner/create', methods=['POST'])
@admin_login_required
def admin_create_banner():
    """创建Banner"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            banner_id = generate_uuid()
            cursor.execute("""
                INSERT INTO banner (id, title, image, link, link_type, link_id, sort, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                banner_id,
                data.get('title', ''),
                data.get('image', ''),
                data.get('link', ''),
                data.get('linkType', '') or data.get('link_type', ''),
                data.get('linkId', '') or data.get('link_id', ''),
                data.get('sort', 0),
                data.get('status', 'active')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "创建成功", "data": {"id": banner_id}})
    finally:
        db.close()


@app.route('/api/admin/banner/update', methods=['POST'])
@admin_login_required
def admin_update_banner():
    """更新Banner"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                UPDATE banner SET title=%s, image=%s, link=%s, link_type=%s, link_id=%s, sort=%s, status=%s
                WHERE id=%s
            """, (
                data.get('title', ''),
                data.get('image', ''),
                data.get('link', ''),
                data.get('linkType', '') or data.get('link_type', ''),
                data.get('linkId', '') or data.get('link_id', ''),
                data.get('sort', 0),
                data.get('status', 'active'),
                data.get('id')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()


@app.route('/api/admin/banner/delete', methods=['POST'])
@admin_login_required
def admin_delete_banner():
    """删除Banner"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM banner WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "删除成功"})
    finally:
        db.close()


@app.route('/api/admin/banner/toggle-status', methods=['POST'])
@admin_login_required
def admin_toggle_banner_status():
    """切换Banner状态"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE banner SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "状态已更新"})
    finally:
        db.close()


# ==================== 邮件配置 ====================

@app.route('/api/admin/email-config', methods=['GET', 'POST'])
@admin_login_required
def admin_email_config():
    """获取/更新邮件配置"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            if request.method == 'GET':
                cursor.execute("SELECT * FROM email_config LIMIT 1")
                config = cursor.fetchone()
                return jsonify({"code": 200, "data": config or {}})
            else:
                data = request.get_json()
                cursor.execute("SELECT id FROM email_config LIMIT 1")
                existing = cursor.fetchone()

                if existing:
                    cursor.execute("""
                        UPDATE email_config SET smtp_server=%s, smtp_port=%s, smtp_username=%s,
                        smtp_password=%s, from_name=%s, enabled=%s
                        WHERE id=%s
                    """, (
                        data.get('smtpServer', ''),
                        data.get('smtpPort', 465),
                        data.get('smtpUsername', ''),
                        data.get('smtpPassword', ''),
                        data.get('fromName', ''),
                        1 if data.get('enabled') else 0,
                        existing['id']
                    ))
                else:
                    cursor.execute("""
                        INSERT INTO email_config (smtp_server, smtp_port, smtp_username, smtp_password, from_name, enabled)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        data.get('smtpServer', ''),
                        data.get('smtpPort', 465),
                        data.get('smtpUsername', ''),
                        data.get('smtpPassword', ''),
                        data.get('fromName', ''),
                        1 if data.get('enabled') else 0
                    ))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()


# ==================== 管理员账号管理 ====================

@app.route('/api/admin/admin/list', methods=['GET'])
@admin_login_required
def admin_get_admin_list():
    """获取管理员列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, username, role, email, last_login, status FROM admin ORDER BY created_at DESC")
            admins = cursor.fetchall()
            for a in admins:
                a['lastLogin'] = a['last_login'].strftime('%Y-%m-%d %H:%M') if a.get('last_login') else ''
            return jsonify({"code": 200, "data": admins})
    finally:
        db.close()


@app.route('/api/admin/admin/create', methods=['POST'])
@admin_login_required
def admin_create_admin():
    """创建管理员"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            admin_id = generate_uuid()
            cursor.execute("""
                INSERT INTO admin (id, username, password, role, email, status)
                VALUES (%s, %s, %s, %s, %s, 'active')
            """, (
                admin_id,
                data.get('username', ''),
                md5_password(data.get('password', '123456')),
                data.get('role', 'staff'),
                data.get('email', '')
            ))
        db.commit()
        return jsonify({"code": 200, "msg": "创建成功", "data": {"id": admin_id}})
    finally:
        db.close()


@app.route('/api/admin/admin/update', methods=['POST'])
@admin_login_required
def admin_update_admin():
    """更新管理员"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            if data.get('password'):
                cursor.execute("""
                    UPDATE admin SET username=%s, role=%s, email=%s, password=%s
                    WHERE id=%s
                """, (
                    data.get('username', ''),
                    data.get('role', 'staff'),
                    data.get('email', ''),
                    md5_password(data.get('password')),
                    data.get('id')
                ))
            else:
                cursor.execute("""
                    UPDATE admin SET username=%s, role=%s, email=%s
                    WHERE id=%s
                """, (
                    data.get('username', ''),
                    data.get('role', 'staff'),
                    data.get('email', ''),
                    data.get('id')
                ))
        db.commit()
        return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()


@app.route('/api/admin/admin/toggle-status', methods=['POST'])
@admin_login_required
def admin_toggle_admin_status():
    """切换管理员状态"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE admin SET status = CASE WHEN status = 'active' THEN 'disabled' ELSE 'active' END WHERE id = %s", (data.get('id'),))
        db.commit()
        return jsonify({"code": 200, "msg": "状态已更新"})
    finally:
        db.close()


@app.route('/api/admin/admin/change-password', methods=['POST'])
@admin_login_required
def admin_change_password():
    """修改密码"""
    data = request.get_json()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT password FROM admin WHERE id = %s", (session.get('admin_id'),))
            admin = cursor.fetchone()
            if not admin or admin['password'] != md5_password(data.get('oldPassword', '')):
                return jsonify({"code": 400, "msg": "原密码错误"})

            cursor.execute("UPDATE admin SET password=%s WHERE id=%s", (md5_password(data.get('newPassword', '')), session.get('admin_id')))
        db.commit()
        return jsonify({"code": 200, "msg": "密码修改成功"})
    finally:
        db.close()


# ==================== 系统日志 ====================

@app.route('/api/admin/log/list', methods=['GET'])
@admin_login_required
def admin_get_log_list():
    """获取系统日志"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 50, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total FROM system_log")
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute(
                "SELECT * FROM system_log ORDER BY created_at DESC LIMIT %s OFFSET %s",
                [page_size, offset]
            )
            logs = cursor.fetchall()
            for log in logs:
                log['createdAt'] = log['created_at'].strftime('%Y-%m-%d %H:%M') if log.get('created_at') else ''

            return jsonify({"code": 200, "data": logs, "total": total})
    finally:
        db.close()


def add_system_log(action, detail=""):
    """添加系统日志"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            log_id = generate_uuid()
            cursor.execute("""
                INSERT INTO system_log (id, action, operator, ip, detail)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                log_id,
                action,
                session.get('admin_username', '系统'),
                request.remote_addr or '',
                detail
            ))
        db.commit()
    except:
        pass
    finally:
        db.close()


# ==================== 文件上传 ====================

@app.route('/api/upload/image', methods=['POST'])
def upload_image():
    """图片上传"""
    if 'file' not in request.files:
        return jsonify({"code": 400, "msg": "没有上传文件"})

    file = request.files['file']
    if file.filename == '':
        return jsonify({"code": 400, "msg": "没有选择文件"})

    if not allowed_file(file.filename):
        return jsonify({"code": 400, "msg": "不支持的文件格式"})

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = datetime.datetime.now().strftime('%Y%m%d%H%M%S') + str(random.randint(1000, 9999)) + '.' + ext
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    file.save(filepath)

    base_url = request.host_url.rstrip('/')
    url = f"{base_url}/uploads/{filename}"
    return jsonify({"code": 200, "msg": "上传成功", "data": {"url": url}})


@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    """提供上传文件的访问"""
    return send_from_directory(UPLOAD_FOLDER, filename)


# ==================== 初始化数据库 ====================

@app.route('/api/init-database', methods=['POST'])
def init_database():
    """初始化数据库（执行init.sql）"""
    init_sql_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "init.sql")

    if not os.path.exists(init_sql_path):
        return jsonify({"code": 500, "msg": "init.sql 文件不存在"})

    with open(init_sql_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    conn = pymysql.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        charset=DB_CONFIG["charset"]
    )

    try:
        statements = []
        current_stmt = ""
        in_string = False
        escape_next = False

        for char in sql_content:
            if escape_next:
                current_stmt += char
                escape_next = False
                continue
            if char == '\\':
                escape_next = True
                current_stmt += char
                continue
            if char == "'" and not escape_next:
                in_string = not in_string
                current_stmt += char
                continue
            if not in_string and char == ';':
                if current_stmt.strip():
                    statements.append(current_stmt.strip())
                current_stmt = ""
                continue
            current_stmt += char

        if current_stmt.strip():
            statements.append(current_stmt.strip())

        with conn.cursor() as cursor:
            for stmt in statements:
                stmt = stmt.strip()
                if not stmt or stmt.startswith('--'):
                    continue
                if stmt.startswith('CREATE DATABASE', re.IGNORECASE) or stmt.startswith('USE ', re.IGNORECASE):
                    try:
                        cursor.execute(stmt)
                        conn.commit()
                    except:
                        pass
                else:
                    try:
                        cursor.execute(stmt)
                        conn.commit()
                    except Exception as e:
                        pass

        return jsonify({"code": 200, "msg": "数据库初始化成功"})
    except Exception as e:
        return jsonify({"code": 500, "msg": f"初始化失败: {str(e)}"})
    finally:
        conn.close()


# ==================== 小程序 Mobile API ====================

# 辅助函数：获取小程序用户ID（从 header token 或 session）
def get_mini_user_id():
    token = request.headers.get('X-Token', '')
    if token:
        db = get_db()
        try:
            with db.cursor() as cursor:
                # 先尝试用openid查询（微信登录）
                cursor.execute("SELECT id, status FROM user WHERE openid=%s AND status='active'", (token,))
                user = cursor.fetchone()
                if user:
                    return user['id']
                # 再尝试用id查询（密码登录）
                cursor.execute("SELECT id, status FROM user WHERE id=%s AND status='active'", (token,))
                user = cursor.fetchone()
                if user:
                    return user['id']
                return None
        finally:
            db.close()
    return session.get('mini_user_id')

def mini_login_required(f):
    """小程序用户登录验证"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_mini_user_id()
        if not user_id:
            return jsonify({"code": 401, "msg": "请先登录"})
        return f(*args, **kwargs)
    return decorated

# ---- 公开接口 ----

@app.route('/api/mobile/home/banners', methods=['GET'])
def mobile_home_banners():
    """首页轮播图"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, title, image, link, link_type, link_id FROM banner WHERE status='active' ORDER BY sort DESC, created_at DESC")
            banners = cursor.fetchall()
            return jsonify({"code": 200, "data": banners})
    finally:
        db.close()

@app.route('/api/mobile/home/recommended', methods=['GET'])
def mobile_home_recommended():
    """首页推荐商品（热门的娃娃+配饰+搭配方案）"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            # 热门娃娃
            cursor.execute("SELECT id, name, price, material, size, images, series, 'doll' as type FROM doll WHERE status='active' AND is_hot=1 ORDER BY created_at DESC LIMIT 10")
            hot_dolls = cursor.fetchall()
            for d in hot_dolls:
                if isinstance(d.get('images'), str):
                    d['images'] = json.loads(d['images']) if d['images'] else []

            # 热门配饰
            cursor.execute("SELECT id, name, price, material, images, category, series, 'accessory' as type FROM accessory WHERE status='active' AND is_hot=1 ORDER BY created_at DESC LIMIT 10")
            hot_accessories = cursor.fetchall()
            for a in hot_accessories:
                if isinstance(a.get('images'), str):
                    a['images'] = json.loads(a['images']) if a['images'] else []

            # 热门搭配方案
            cursor.execute("SELECT id, name, cover_image, doll_name, total_price, 'outfit' as type FROM outfit_template WHERE is_hot=1 ORDER BY created_at DESC LIMIT 10")
            hot_outfits = cursor.fetchall()

            return jsonify({"code": 200, "data": {
                "hotDolls": hot_dolls,
                "hotAccessories": hot_accessories,
                "hotOutfits": hot_outfits
            }})
    finally:
        db.close()

@app.route('/api/mobile/location/reverse', methods=['GET'])
def mobile_location_reverse():
    """逆地理编码 - 通过经纬度获取省市区"""
    latitude = request.args.get('latitude', '')
    longitude = request.args.get('longitude', '')
    if not latitude or not longitude:
        return jsonify({"code": 400, "msg": "经纬度不能为空"})

    # 高德地图 JS API Key + Secret
    key = 'c0eb4784423b9db15f0f707d6221a776'
    secret = '9f655f05b39bd5340a1b7140930a6ad1'

    # 生成签名
    params = {'key': key, 'location': f'{longitude},{latitude}'}
    sorted_params = sorted(params.items())
    param_str = ''.join([f"{k}{v}" for k, v in sorted_params])
    sign_str = param_str + secret
    sign = hashlib.md5(sign_str.encode()).hexdigest()

    url = 'https://restapi.amap.com/v3/geocode/regeo'
    full_url = f'{url}?key={key}&location={longitude},{latitude}&sig={sign}'
    try:
        resp = requests.get(full_url, timeout=5)
        data = resp.json()
        if data.get('status') == '1' and data.get('regeocode'):
            addr = data['regeocode']['addressComponent']
            return jsonify({
                "code": 200,
                "data": {
                    "province": addr.get('province', ''),
                    "city": addr.get('city', ''),
                    "district": addr.get('district', '')
                }
            })
        return jsonify({"code": 400, "msg": "解析失败"})
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)})

@app.route('/api/mobile/series/list', methods=['GET'])
def mobile_series_list():
    """系列列表（娃娃用）"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, name FROM series WHERE status='active' AND type IN ('doll', 'both') ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return jsonify({"code": 200, "data": rows})
    finally:
        db.close()

@app.route('/api/mobile/category/list', methods=['GET'])
def mobile_category_list():
    """分类列表（配饰用）"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, name, value FROM category WHERE status='active' ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return jsonify({"code": 200, "data": rows})
    finally:
        db.close()

@app.route('/api/mobile/doll/list', methods=['GET'])
def mobile_doll_list():
    """娃娃商品列表"""
    series = request.args.get('series', '')
    keyword = request.args.get('keyword', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            where = "WHERE status='active'"
            params = []
            if series:
                where += " AND series=%s"
                params.append(series)
            if keyword:
                where += " AND name LIKE %s"
                params.append(f'%{keyword}%')

            count_sql = f"SELECT COUNT(*) as total FROM doll {where}"
            cursor.execute(count_sql, params)
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute(f"SELECT id, name, price, material, size, series, images, default_accessory FROM doll {where} ORDER BY created_at DESC LIMIT %s OFFSET %s", params + [page_size, offset])
            dolls = cursor.fetchall()
            for d in dolls:
                if isinstance(d.get('images'), str):
                    d['images'] = json.loads(d['images']) if d['images'] else []
                d['coverImage'] = d['images'][0] if d['images'] else ''
                d['defaultAccessory'] = d.get('default_accessory') or ''

            return jsonify({"code": 200, "data": dolls, "total": total, "page": page, "page_size": page_size})
    finally:
        db.close()

@app.route('/api/mobile/doll/detail/<doll_id>', methods=['GET'])
def mobile_doll_detail(doll_id):
    """娃娃详情"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM doll WHERE id=%s AND status='active'", (doll_id,))
            doll = cursor.fetchone()
            if not doll:
                return jsonify({"code": 404, "msg": "娃娃不存在"})
            if isinstance(doll.get('images'), str):
                doll['images'] = json.loads(doll['images']) if doll['images'] else []
            doll['material'] = doll.get('material', '')
            doll['size'] = doll.get('size', '')
            doll['series'] = doll.get('series', '')
            doll['patentNo'] = doll.get('patent_no', '')
            # 检查是否已收藏
            user_id = get_mini_user_id()
            if user_id:
                cursor.execute("SELECT id FROM mini_user_favorite WHERE user_id=%s AND item_type='doll' AND item_id=%s", (user_id, doll_id))
                fav = cursor.fetchone()
                doll['isFavorited'] = bool(fav)
            else:
                doll['isFavorited'] = False
            doll['defaultAccessory'] = doll.get('default_accessory') or ''
            doll['minQuantity'] = doll.get('min_quantity') or 1
            doll['smallBoxCapacity'] = doll.get('small_box_capacity') or 0
            doll['mediumBoxCapacity'] = doll.get('medium_box_capacity') or 0
            doll['largeBoxCapacity'] = doll.get('large_box_capacity') or 0
            selected_acc = doll.get('selected_accessories')
            if isinstance(selected_acc, str):
                doll['selectedAccessories'] = json.loads(selected_acc) if selected_acc else []
            elif isinstance(selected_acc, list):
                doll['selectedAccessories'] = selected_acc
            else:
                doll['selectedAccessories'] = []
            # 增加浏览量
            cursor.execute("UPDATE doll SET views=views+1 WHERE id=%s", (doll_id,))
            db.commit()
            return jsonify({"code": 200, "data": doll})
    finally:
        db.close()


@app.route('/api/mobile/doll/<doll_id>/outfit-accessories', methods=['GET'])
def mobile_doll_outfit_accessories(doll_id):
    """获取娃娃的已选配饰列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            # 检查娃娃是否存在
            cursor.execute("SELECT selected_accessories FROM doll WHERE id=%s AND status='active'", (doll_id,))
            doll = cursor.fetchone()
            if not doll:
                return jsonify({"code": 404, "msg": "娃娃不存在"})
            selected_acc = doll.get('selected_accessories')
            if isinstance(selected_acc, str):
                accessories = json.loads(selected_acc) if selected_acc else []
            elif isinstance(selected_acc, list):
                accessories = selected_acc
            else:
                accessories = []
            # 如果配饰列表是简单对象数组 {id, name, price}，需要补充完整信息
            result = []
            for acc in accessories:
                if isinstance(acc, dict) and 'id' in acc:
                    # 查询配饰完整信息
                    cursor.execute(
                        "SELECT id, name, price, material, images, category, series FROM accessory WHERE id=%s AND status='active'",
                        (acc['id'],)
                    )
                    acc_detail = cursor.fetchone()
                    if acc_detail:
                        if isinstance(acc_detail.get('images'), str):
                            acc_detail['images'] = json.loads(acc_detail['images']) if acc_detail['images'] else []
                        acc_detail['coverImage'] = acc_detail['images'][0] if acc_detail['images'] else ''
                        acc_detail['selectedPrice'] = acc.get('price', acc_detail.get('price', 0))
                        result.append(acc_detail)
            return jsonify({"code": 200, "data": result})
    finally:
        db.close()


@app.route('/api/mobile/accessory/list', methods=['GET'])
def mobile_accessory_list():
    """配饰商品列表"""
    category = request.args.get('category', '')
    series = request.args.get('series', '')
    keyword = request.args.get('keyword', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            where = "WHERE status='active'"
            params = []
            if category:
                where += " AND category=%s"
                params.append(category)
            if series:
                where += " AND series=%s"
                params.append(series)
            if keyword:
                where += " AND name LIKE %s"
                params.append(f'%{keyword}%')

            count_sql = f"SELECT COUNT(*) as total FROM accessory {where}"
            cursor.execute(count_sql, params)
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute(f"SELECT id, name, price, material, images, category, series FROM accessory {where} ORDER BY created_at DESC LIMIT %s OFFSET %s", params + [page_size, offset])
            accessories = cursor.fetchall()
            for a in accessories:
                if isinstance(a.get('images'), str):
                    a['images'] = json.loads(a['images']) if a['images'] else []
                a['coverImage'] = a['images'][0] if a['images'] else ''

            return jsonify({"code": 200, "data": accessories, "total": total, "page": page, "page_size": page_size})
    finally:
        db.close()

@app.route('/api/mobile/accessory/detail/<acc_id>', methods=['GET'])
def mobile_accessory_detail(acc_id):
    """配饰详情"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM accessory WHERE id=%s AND status='active'", (acc_id,))
            acc = cursor.fetchone()
            if not acc:
                return jsonify({"code": 404, "msg": "配饰不存在"})
            if isinstance(acc.get('images'), str):
                acc['images'] = json.loads(acc['images']) if acc['images'] else []
            if isinstance(acc.get('applicable_dolls'), str):
                acc['applicableDolls'] = json.loads(acc['applicable_dolls']) if acc['applicable_dolls'] else []
            else:
                acc['applicableDolls'] = acc.get('applicable_dolls') or []
            # 增加浏览量
            cursor.execute("UPDATE accessory SET views=views+1 WHERE id=%s", (acc_id,))
            db.commit()
            return jsonify({"code": 200, "data": acc})
    finally:
        db.close()

@app.route('/api/mobile/outfit/list', methods=['GET'])
def mobile_outfit_list():
    """搭配方案列表（默认模板）"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT o.id, o.name, o.cover_image, o.doll_name, o.doll_id, o.total_price, o.accessories, d.series as doll_series
                FROM outfit_template o
                LEFT JOIN doll d ON o.doll_id = d.id
                ORDER BY o.is_hot DESC, o.created_at DESC
            """)
            outfits = cursor.fetchall()
            for o in outfits:
                accessories = o.get('accessories')
                if isinstance(accessories, str):
                    accessories = json.loads(accessories) if accessories else []
                # 只返回配件名称列表，不返回价格
                o['accessoryNames'] = [a.get('name', '') for a in accessories] if isinstance(accessories, list) else []
                o['dollSeries'] = o.get('doll_series', '')
            return jsonify({"code": 200, "data": outfits})
    finally:
        db.close()

@app.route('/api/mobile/outfit/detail/<outfit_id>', methods=['GET'])
def mobile_outfit_detail(outfit_id):
    """搭配方案详情"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM outfit_template WHERE id=%s", (outfit_id,))
            outfit = cursor.fetchone()
            if not outfit:
                return jsonify({"code": 404, "msg": "搭配方案不存在"})
            if isinstance(outfit.get('accessories'), str):
                outfit['accessories'] = json.loads(outfit['accessories']) if outfit['accessories'] else []
            # 获取娃娃的材质和尺寸
            if outfit.get('doll_id'):
                cursor.execute("SELECT material, size FROM doll WHERE id=%s", (outfit['doll_id'],))
                doll = cursor.fetchone()
                if doll:
                    outfit['material'] = doll.get('material', '')
                    outfit['size'] = doll.get('size', '')
            return jsonify({"code": 200, "data": outfit})
    finally:
        db.close()

# ---- 用户认证接口 ----

def get_region_from_ip(ip):
    """通过IP解析省市区"""
    try:
        if not ip or ip in ('127.0.0.1', 'localhost', '::1', ''):
            return ''
        resp = requests.get(f'http://ip-api.com/json/{ip}?fields=status,regionName,city', timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('status') == 'success':
                region = f"{data.get('regionName', '')}{data.get('city', '')}"
                return region
    except Exception as e:
        print(f'IP解析失败: {e}')
    return ''

@app.route('/api/mobile/auth/decrypt-phone', methods=['POST'])
def mobile_decrypt_phone():
    """解密微信手机号（通过 encryptedData + iv + code）"""
    data = request.get_json() or {}
    encrypted_data = data.get('encryptedData', '')
    iv = data.get('iv', '')
    code = data.get('code', '')
    print(f"[DECRYPT PHONE] encryptedData={encrypted_data[:50] if encrypted_data else None}..., iv={iv}, code={code}", flush=True)
    phone = decrypt_wechat_phone_v2(encrypted_data, iv, code)
    if phone:
        return jsonify({"code": 200, "phoneNumber": phone})
    else:
        return jsonify({"code": 400, "msg": "解密失败"})

@app.route('/api/mobile/auth/login', methods=['POST'])
def mobile_auth_login():
    """微信授权登录"""
    data = request.get_json() or {}
    code = data.get('code', '')
    openid = data.get('openid', '')
    nickname = data.get('nickname', '')
    avatar = data.get('avatar', '')
    phone = data.get('phone', '')

    print(f"[LOGIN] phone={phone}, openid={openid}, code={code[:20] if code else 'none'}...", flush=True)

    # 如果有code，尝试通过code换取openid（需要配置微信AppID和AppSecret）
    # 如果没有code但有openid，直接使用openid
    if not openid:
        if code:
            # 尝试用code换取openid（开发环境用伪openid）
            openid = f"code_{code}"
        else:
            return jsonify({"code": 400, "msg": "openid 不能为空"})

    # 如果没有提供 phone 但提供了 code，尝试解密手机号
    if not phone and code:
        decrypted_phone = decrypt_wechat_phone(code)
        if decrypted_phone:
            phone = decrypted_phone
            print(f"[LOGIN] decrypted phone: {phone}", flush=True)

    # 获取IP并解析地区
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip()
    region = get_region_from_ip(client_ip)

    db = get_db()
    try:
        with db.cursor() as cursor:
            user = None

            # 优先按手机号查找用户（如果提供了手机号）
            if phone:
                cursor.execute("SELECT * FROM user WHERE phone=%s", (phone,))
                user = cursor.fetchone()
                print(f"[LOGIN] phone lookup: user={user}", flush=True)

            # 如果没找到，按openid查找
            if not user:
                cursor.execute("SELECT * FROM user WHERE openid=%s", (openid,))
                user = cursor.fetchone()
                print(f"[LOGIN] openid lookup: user={user}", flush=True)

            if user:
                # 如果是用手机号找到的，但openid不同，需要更新openid
                if phone and user.get('openid') != openid:
                    cursor.execute("UPDATE user SET openid=%s WHERE id=%s", (openid, user['id']))
                    db.commit()
                    print(f"[LOGIN] updated openid for user {user['id']}", flush=True)

                # 更新昵称、头像（如果有新数据）
                updates = []
                params = []
                if nickname and nickname != user.get('nickname'):
                    updates.append("nickname=%s")
                    params.append(nickname)
                if avatar and avatar != user.get('avatar'):
                    updates.append("avatar=%s")
                    params.append(avatar)
                if updates:
                    params.append(user['id'])
                    cursor.execute(f"UPDATE user SET {','.join(updates)} WHERE id=%s", params)
                    db.commit()

                if user['status'] == 'disabled':
                    return jsonify({"code": 403, "msg": "您的账号已被禁用，请联系管理员"})
                if user['status'] == 'pending':
                    return jsonify({"code": 403, "msg": "您的账号正在审核中，请耐心等待"})
                # active - 登录成功
                cursor.execute("UPDATE user SET last_active=NOW() WHERE id=%s", (user['id'],))
                db.commit()
                return jsonify({"code": 200, "data": {"id": user['id'], "nickname": user['nickname'], "avatar": user['avatar'], "phone": user.get('phone'), "token": openid}})

            # 新用户：自动创建并审核通过（小程序用户直接生效）
            user_id = generate_uuid()
            cursor.execute("""
                INSERT INTO user (id, openid, nickname, avatar, phone, status, region, created_at)
                VALUES (%s, %s, %s, %s, %s, 'active', %s, NOW())
            """, (user_id, openid, nickname, avatar, phone or None, region))
            db.commit()
            print(f"[LOGIN] created new user {user_id}", flush=True)
            return jsonify({"code": 200, "msg": "登录成功", "data": {"id": user_id, "openid": openid, "nickname": nickname, "avatar": avatar, "phone": phone, "token": openid}})
    finally:
        db.close()

@app.route('/api/mobile/auth/login-by-password', methods=['POST'])
def mobile_auth_login_by_password():
    """手机号密码登录（新用户自动注册申请）"""
    data = request.get_json() or {}
    phone = data.get('phone', '')
    password = data.get('password', '')

    if not phone or not password:
        return jsonify({"code": 400, "msg": "手机号和密码不能为空"})

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM user WHERE phone=%s", (phone,))
            user = cursor.fetchone()

            if not user:
                # 新用户：自动创建注册申请
                user_id = generate_uuid()
                password_md5 = hashlib.md5(password.encode()).hexdigest()
                cursor.execute("""
                    INSERT INTO user (id, phone, password, status, created_at)
                    VALUES (%s, %s, %s, 'pending', NOW())
                """, (user_id, phone, password_md5))
                db.commit()
                return jsonify({"code": 200, "msg": "您是新用户，账号开通申请已自动发送，请稍等"})

            # 验证密码（MD5加密后比较）
            input_password_md5 = hashlib.md5(password.encode()).hexdigest()
            if user.get('password') and user['password'] != input_password_md5:
                return jsonify({"code": 401, "msg": "密码错误"})

            if user['status'] == 'disabled':
                return jsonify({"code": 403, "msg": "您的账号已被禁用，请联系管理员"})
            if user['status'] == 'pending':
                return jsonify({"code": 403, "msg": "您的账号正在审核中，请耐心等待"})

            # 密码登录用户也返回id作为token
            cursor.execute("UPDATE user SET last_active=NOW() WHERE id=%s", (user['id'],))
            db.commit()
            return jsonify({"code": 200, "data": {"id": user['id'], "nickname": user['nickname'], "avatar": user['avatar'], "phone": user.get('phone'), "token": user['id']}})
    finally:
        db.close()

@app.route('/api/mobile/auth/register-apply', methods=['POST'])
def mobile_auth_register_apply():
    """用户注册申请"""
    data = request.get_json() or {}
    openid = data.get('openid', '')
    phone = data.get('phone', '')
    password = data.get('password', '')

    if not phone:
        return jsonify({"code": 400, "msg": "手机号不能为空"})

    db = get_db()
    try:
        with db.cursor() as cursor:
            # 检查手机号是否已存在
            cursor.execute("SELECT * FROM user WHERE phone=%s", (phone,))
            existing = cursor.fetchone()
            if existing:
                return jsonify({"code": 400, "msg": "该手机号已注册"})

            # 创建注册申请
            user_id = generate_uuid()
            cursor.execute("""
                INSERT INTO user (id, openid, phone, password, status, created_at)
                VALUES (%s, %s, %s, %s, 'pending', NOW())
            """, (user_id, openid or '', phone, password or ''))
            db.commit()
            return jsonify({"code": 200, "msg": "注册申请已发送，请等待审核"})
    finally:
        db.close()

@app.route('/api/mobile/auth/profile', methods=['GET'])
@mini_login_required
def mobile_auth_profile():
    """获取用户信息"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, openid, nickname, avatar, phone, region, created_at FROM user WHERE id=%s", (get_mini_user_id(),))
            user = cursor.fetchone()
            if not user:
                return jsonify({"code": 404, "msg": "用户不存在"})
            user['createdAt'] = user['created_at'].strftime('%Y-%m-%d') if user.get('created_at') else ''
            return jsonify({"code": 200, "data": user})
    finally:
        db.close()

@app.route('/api/mobile/auth/profile', methods=['POST'])
@mini_login_required
def mobile_auth_update_profile():
    """更新用户信息"""
    data = request.get_json() or {}
    user_id = get_mini_user_id()
    print(f"[UPDATE PROFILE] user_id={user_id}, token={request.headers.get('X-Token', '')}, data={data}", flush=True)
    if not user_id:
        return jsonify({"code": 401, "msg": "请先登录"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            updates = []
            params = []
            if data.get('nickname'):
                updates.append("nickname=%s")
                params.append(data['nickname'])
            if data.get('avatar'):
                updates.append("avatar=%s")
                params.append(data['avatar'])
            if data.get('phone'):
                # 检查手机号是否已被其他用户使用
                cursor.execute("SELECT id FROM user WHERE phone=%s AND id!=%s", (data['phone'], user_id))
                existing = cursor.fetchone()
                if existing:
                    return jsonify({"code": 400, "msg": "该手机号已被使用"})
                updates.append("phone=%s")
                params.append(data['phone'])
            if data.get('region'):
                updates.append("region=%s")
                params.append(data['region'])
            print(f"[UPDATE PROFILE] updates={updates}, params={params}", flush=True)
            if updates:
                params.append(user_id)
                cursor.execute(f"UPDATE user SET {','.join(updates)} WHERE id=%s", params)
                db.commit()
            return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()

@app.route('/api/mobile/auth/logout', methods=['POST'])
@mini_login_required
def mobile_auth_logout():
    """退出登录"""
    session.pop('mini_user_id', None)
    session.pop('mini_user_openid', None)
    return jsonify({"code": 200, "msg": "退出成功"})

# ---- 用户收货地址 ----

@app.route('/api/mobile/address/list', methods=['GET'])
@mini_login_required
def mobile_address_list():
    """获取用户收货地址列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM user_address WHERE user_id=%s ORDER BY is_default DESC, created_at DESC", (get_mini_user_id(),))
            addresses = cursor.fetchall()
            return jsonify({"code": 200, "data": addresses})
    finally:
        db.close()

@app.route('/api/mobile/address/create', methods=['POST'])
@mini_login_required
def mobile_address_create():
    """新增收货地址"""
    data = request.get_json() or {}
    if not data.get('name') or not data.get('phone') or not data.get('province') or not data.get('city') or not data.get('detail'):
        return jsonify({"code": 400, "msg": "缺少必填字段"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            address_id = generate_uuid()
            if data.get('is_default') == 1:
                cursor.execute("UPDATE user_address SET is_default=0 WHERE user_id=%s", (get_mini_user_id(),))
            cursor.execute("""
                INSERT INTO user_address (id, user_id, name, phone, province, city, district, detail, is_default)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (address_id, get_mini_user_id(), data['name'], data['phone'], data['province'], data['city'], data.get('district', ''), data['detail'], data.get('is_default', 0)))
            db.commit()
            return jsonify({"code": 200, "msg": "新增成功", "data": {"id": address_id}})
    finally:
        db.close()

@app.route('/api/mobile/address/update', methods=['POST'])
@mini_login_required
def mobile_address_update():
    """更新收货地址"""
    data = request.get_json() or {}
    if not data.get('id'):
        return jsonify({"code": 400, "msg": "地址ID不能为空"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id FROM user_address WHERE id=%s AND user_id=%s", (data['id'], get_mini_user_id()))
            if not cursor.fetchone():
                return jsonify({"code": 404, "msg": "地址不存在"})
            if data.get('is_default') == 1:
                cursor.execute("UPDATE user_address SET is_default=0 WHERE user_id=%s", (get_mini_user_id(),))
            cursor.execute("""
                UPDATE user_address SET name=%s, phone=%s, province=%s, city=%s, district=%s, detail=%s, is_default=%s
                WHERE id=%s AND user_id=%s
            """, (data['name'], data['phone'], data['province'], data['city'], data.get('district', ''), data['detail'], data.get('is_default', 0), data['id'], get_mini_user_id()))
            db.commit()
            return jsonify({"code": 200, "msg": "更新成功"})
    finally:
        db.close()

@app.route('/api/mobile/address/delete', methods=['POST'])
@mini_login_required
def mobile_address_delete():
    """删除收货地址"""
    data = request.get_json() or {}
    if not data.get('id'):
        return jsonify({"code": 400, "msg": "地址ID不能为空"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM user_address WHERE id=%s AND user_id=%s", (data['id'], get_mini_user_id()))
            db.commit()
            return jsonify({"code": 200, "msg": "删除成功"})
    finally:
        db.close()

@app.route('/api/mobile/address/set-default', methods=['POST'])
@mini_login_required
def mobile_address_set_default():
    """设置默认收货地址"""
    data = request.get_json() or {}
    if not data.get('id'):
        return jsonify({"code": 400, "msg": "地址ID不能为空"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE user_address SET is_default=0 WHERE user_id=%s", (get_mini_user_id(),))
            cursor.execute("UPDATE user_address SET is_default=1 WHERE id=%s AND user_id=%s", (data['id'], get_mini_user_id()))
            db.commit()
            return jsonify({"code": 200, "msg": "设置成功"})
    finally:
        db.close()

# ---- 公司信息（小程序端） ----

@app.route('/api/mobile/company/info', methods=['GET'])
def mobile_company_info():
    """获取公司基本信息"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM company_info LIMIT 1")
            info = cursor.fetchone()
            if info:
                info['workHours'] = info.get('work_hours', '')
                info['mapLng'] = info.get('map_lng', '')
                info['mapLat'] = info.get('map_lat', '')
            return jsonify({"code": 200, "data": info or {}})
    finally:
        db.close()

@app.route('/api/mobile/company/certificates', methods=['GET'])
def mobile_company_certificates():
    """获取资质证书列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM certificate WHERE status='active' ORDER BY sort DESC, created_at DESC")
            certs = cursor.fetchall()
            return jsonify({"code": 200, "data": certs})
    finally:
        db.close()

# ---- 用户收藏 ----

@app.route('/api/mobile/favorites', methods=['GET'])
@mini_login_required
def mobile_favorites_list():
    """我的收藏列表"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT f.id, f.item_type, f.item_id, f.created_at,
                    d.name as doll_name, d.price as doll_price, d.images as doll_images,
                    a.name as acc_name, a.price as acc_price, a.images as acc_images,
                    o.name as outfit_name, o.total_price as outfit_price, o.cover_image as outfit_image
                FROM mini_user_favorite f
                LEFT JOIN doll d ON f.item_type='doll' AND f.item_id=d.id
                LEFT JOIN accessory a ON f.item_type='accessory' AND f.item_id=a.id
                LEFT JOIN outfit_template o ON f.item_type='outfit' AND f.item_id=o.id
                WHERE f.user_id=%s
                ORDER BY f.created_at DESC
            """, (get_mini_user_id(),))
            rows = cursor.fetchall()
            result = []
            for r in rows:
                item = {'id': r['id'], 'item_type': r['item_type'], 'item_id': r['item_id'], 'createdAt': r['created_at'].strftime('%Y-%m-%d') if r.get('created_at') else ''}
                if r['item_type'] == 'doll':
                    imgs = json.loads(r['doll_images']) if isinstance(r['doll_images'], str) else (r['doll_images'] or [])
                    item['name'] = r['doll_name']
                    item['price'] = float(r['doll_price'] or 0)
                    item['coverImage'] = imgs[0] if imgs else ''
                elif r['item_type'] == 'accessory':
                    imgs = json.loads(r['acc_images']) if isinstance(r['acc_images'], str) else (r['acc_images'] or [])
                    item['name'] = r['acc_name']
                    item['price'] = float(r['acc_price'] or 0)
                    item['coverImage'] = imgs[0] if imgs else ''
                elif r['item_type'] == 'outfit':
                    item['name'] = r['outfit_name']
                    item['price'] = float(r['outfit_price'] or 0)
                    item['coverImage'] = r['outfit_image'] or ''
                    item['accessories'] = []
                result.append(item)
            return jsonify({"code": 200, "data": result})
    finally:
        db.close()

@app.route('/api/mobile/favorites', methods=['POST'])
@mini_login_required
def mobile_favorites_add():
    """添加收藏"""
    data = request.get_json() or {}
    item_type = data.get('item_type')
    item_id = data.get('item_id')
    if not item_type or not item_id:
        return jsonify({"code": 400, "msg": "参数不完整"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            fav_id = generate_uuid()
            cursor.execute("""
                INSERT INTO mini_user_favorite (id, user_id, item_type, item_id)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE id=id
            """, (fav_id, get_mini_user_id(), item_type, item_id))
            db.commit()
            return jsonify({"code": 200, "msg": "收藏成功"})
    finally:
        db.close()

@app.route('/api/mobile/favorites/<fav_id>', methods=['DELETE'])
@mini_login_required
def mobile_favorites_delete(fav_id):
    """取消收藏"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM mini_user_favorite WHERE id=%s AND user_id=%s", (fav_id, get_mini_user_id()))
            db.commit()
            return jsonify({"code": 200, "msg": "已取消收藏"})
    finally:
        db.close()

@app.route('/api/mobile/favorites/by-item', methods=['DELETE'])
@mini_login_required
def mobile_favorites_delete_by_item():
    """根据item_type和item_id取消收藏"""
    # 尝试从 body 或 query 获取参数
    data = request.get_json(force=True) or {}
    item_type = data.get('item_type') or request.args.get('item_type')
    item_id = data.get('item_id') or request.args.get('item_id')
    if not item_type or not item_id:
        return jsonify({"code": 400, "msg": "item_type和item_id不能为空"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM mini_user_favorite WHERE user_id=%s AND item_type=%s AND item_id=%s", (get_mini_user_id(), item_type, item_id))
            db.commit()
            return jsonify({"code": 200, "msg": "已取消收藏"})
    finally:
        db.close()

# ---- 用户购物车 ----

@app.route('/api/mobile/cart', methods=['GET'])
@mini_login_required
def mobile_cart_list():
    """购物车列表"""
    user_id = get_mini_user_id()
    if not user_id:
        return jsonify({"code": 401, "msg": "请先登录"})
    print(f"[CART LIST] user_id={user_id}, token={request.headers.get('X-Token', '')}")
    db = get_db()
    try:
        with db.cursor() as cursor:
            try:
                cursor.execute("""
                    SELECT c.id, c.item_type, c.item_id, c.quantity, c.accessories, c.created_at,
                        c.pindan_group_id, c.pindan_group_name, c.box_size,
                        d.name as doll_name, d.price as doll_price, d.images as doll_images, d.default_accessory as doll_default_accessory,
                        a.name as acc_name, a.price as acc_price, a.images as acc_images,
                        o.name as outfit_name, o.total_price as outfit_price, o.cover_image as outfit_image, o.accessories as outfit_default_accessories
                    FROM mini_cart c
                    LEFT JOIN doll d ON c.item_type='doll' AND c.item_id=d.id
                    LEFT JOIN accessory a ON c.item_type='accessory' AND c.item_id=a.id
                    LEFT JOIN outfit_template o ON c.item_type='outfit' AND c.item_id=o.id
                    WHERE c.user_id=%s
                    ORDER BY c.pindan_group_id DESC, c.created_at DESC
                """, (user_id,))
                print(f"[CART LIST] First query succeeded")
            except Exception as col_err:
                print(f"[CART LIST] First query failed: {col_err}, trying fallback")
                # 如果accessories列不存在，用基础字段
                try:
                    cursor.execute("""
                        SELECT c.id, c.item_type, c.item_id, c.quantity, c.accessories, c.created_at,
                            d.name as doll_name, d.price as doll_price, d.images as doll_images, d.default_accessory as doll_default_accessory,
                            a.name as acc_name, a.price as acc_price, a.images as acc_images,
                            o.name as outfit_name, o.total_price as outfit_price, o.cover_image as outfit_image, o.accessories as outfit_default_accessories
                        FROM mini_cart c
                        LEFT JOIN doll d ON c.item_type='doll' AND c.item_id=d.id
                        LEFT JOIN accessory a ON c.item_type='accessory' AND c.item_id=a.id
                        LEFT JOIN outfit_template o ON c.item_type='outfit' AND c.item_id=o.id
                        WHERE c.user_id=%s
                        ORDER BY c.created_at DESC
                    """, (user_id,))
                    print(f"[CART LIST] Fallback query succeeded")
                except Exception as fallback_err:
                    print(f"[CART LIST] Fallback query also failed: {fallback_err}")
                    # 最后的fallback
                    cursor.execute("""
                        SELECT c.id, c.item_type, c.item_id, c.quantity, c.created_at,
                            d.name as doll_name, d.price as doll_price, d.images as doll_images, d.default_accessory as doll_default_accessory,
                            a.name as acc_name, a.price as acc_price, a.images as acc_images,
                            o.name as outfit_name, o.total_price as outfit_price, o.cover_image as outfit_image
                        FROM mini_cart c
                        LEFT JOIN doll d ON c.item_type='doll' AND c.item_id=d.id
                        LEFT JOIN accessory a ON c.item_type='accessory' AND c.item_id=a.id
                        LEFT JOIN outfit_template o ON c.item_type='outfit' AND c.item_id=o.id
                        WHERE c.user_id=%s
                        ORDER BY c.created_at DESC
                    """, (user_id,))
            rows = cursor.fetchall()
            result = []
            for r in rows:
                item = {
                    'id': r['id'],
                    'item_type': r['item_type'],
                    'item_id': r['item_id'],
                    'quantity': r['quantity'],
                    'createdAt': r['created_at'].strftime('%Y-%m-%d') if r.get('created_at') else '',
                    'pindan_group_id': r.get('pindan_group_id') or '',
                    'pindan_group_name': r.get('pindan_group_name') or '',
                    'boxSize': r.get('box_size') or 'small',
                }
                # 解析已选配饰
                if r.get('accessories'):
                    try:
                        if isinstance(r['accessories'], str):
                            item['accessories'] = json.loads(r['accessories'])
                        else:
                            item['accessories'] = r['accessories']
                    except:
                        item['accessories'] = []
                else:
                    item['accessories'] = []
                if r['item_type'] == 'doll':
                    imgs = json.loads(r['doll_images']) if isinstance(r['doll_images'], str) else (r['doll_images'] or [])
                    item['name'] = r['doll_name']
                    item['price'] = float(r['doll_price'] or 0)
                    item['coverImage'] = imgs[0] if imgs else ''
                    item['defaultAccessory'] = r.get('doll_default_accessory') or ''
                elif r['item_type'] == 'accessory':
                    imgs = json.loads(r['acc_images']) if isinstance(r['acc_images'], str) else (r['acc_images'] or [])
                    item['name'] = r['acc_name']
                    item['price'] = float(r['acc_price'] or 0)
                    item['coverImage'] = imgs[0] if imgs else ''
                elif r['item_type'] == 'outfit':
                    item['name'] = r['outfit_name']
                    item['price'] = float(r['outfit_price'] or 0)
                    item['coverImage'] = r['outfit_image'] or ''
                    # 保存默认配饰到 defaultAccessories 字段（用于显示"搭配"标签后）
                    if r.get('outfit_default_accessories'):
                        try:
                            default_accs = json.loads(r['outfit_default_accessories']) if isinstance(r['outfit_default_accessories'], str) else r['outfit_default_accessories']
                            item['defaultAccessories'] = default_accs or []
                        except:
                            item['defaultAccessories'] = []
                    else:
                        item['defaultAccessories'] = []
                result.append(item)
            return jsonify({"code": 200, "data": result})
    finally:
        db.close()

@app.route('/api/mobile/cart', methods=['POST'])
@mini_login_required
def mobile_cart_add():
    """加入购物车"""
    import sys
    data = request.get_json() or {}
    print(f"[CART ADD] raw_data={data}", flush=True)
    item_type = data.get('item_type')
    item_id = data.get('item_id')
    accessories = data.get('accessories')  # [{id, name, price}, ...]
    quantity = data.get('quantity', 1)  # 默认为1
    box_size = data.get('box_size', 'small')  # 默认为小箱子
    pindan_group_id = data.get('pindan_group_id')
    pindan_group_name = data.get('pindan_group_name')
    print(f"[CART ADD] pindan_group_id={pindan_group_id}, pindan_group_name={pindan_group_name}, box_size={box_size}", flush=True)
    if not item_type or not item_id:
        return jsonify({"code": 400, "msg": "参数不完整"})
    user_id = get_mini_user_id()
    print(f"[CART ADD] user_id={user_id}, token={request.headers.get('X-Token', '')}", flush=True)
    if not user_id:
        return jsonify({"code": 401, "msg": "请先登录"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            acc_json = json.dumps(accessories) if accessories else None
            cart_id = generate_uuid()
            print(f"[CART ADD] INSERTING: cart_id={cart_id}, user_id={user_id}, item_type={item_type}, item_id={item_id}, pindan_group_id={pindan_group_id}", flush=True)
            # 总是插入新记录，不做重复检查（允许同一商品多次添加到购物车或不同拼单组）
            try:
                cursor.execute("INSERT INTO mini_cart (id, user_id, item_type, item_id, accessories, quantity, pindan_group_id, pindan_group_name, box_size) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)", (cart_id, user_id, item_type, item_id, acc_json, quantity, pindan_group_id, pindan_group_name, box_size))
                print(f"[CART ADD] INSERT SUCCESS", flush=True)
            except Exception as insert_err:
                print(f"[CART ADD] INSERT FAILED: {insert_err}", flush=True)
                import traceback
                traceback.print_exc(file=sys.stdout)
                try:
                    cursor.execute("INSERT INTO mini_cart (id, user_id, item_type, item_id, accessories, quantity, box_size) VALUES (%s, %s, %s, %s, %s, %s, %s)", (cart_id, user_id, item_type, item_id, acc_json, quantity, box_size))
                    print(f"[CART ADD] FALLBACK INSERT SUCCESS", flush=True)
                except Exception as e2:
                    print(f"[CART ADD] FALLBACK INSERT ALSO FAILED: {e2}", flush=True)
                    cursor.execute("INSERT INTO mini_cart (id, user_id, item_type, item_id, quantity) VALUES (%s, %s, %s, %s, %s)", (cart_id, user_id, item_type, item_id, quantity))
            db.commit()
            return jsonify({"code": 200, "msg": "已加入购物车"})
    finally:
        db.close()

@app.route('/api/mobile/cart/<cart_id>', methods=['DELETE'])
@mini_login_required
def mobile_cart_delete(cart_id):
    """删除购物车项"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM mini_cart WHERE id=%s AND user_id=%s", (cart_id, get_mini_user_id()))
            db.commit()
            return jsonify({"code": 200, "msg": "已删除"})
    finally:
        db.close()

@app.route('/api/mobile/cart/<cart_id>', methods=['PUT'])
@mini_login_required
def mobile_cart_update(cart_id):
    """更新购物车项数量或配饰"""
    data = request.get_json() or {}
    db = get_db()
    try:
        with db.cursor() as cursor:
            # 获取当前购物车项
            cursor.execute("SELECT * FROM mini_cart WHERE id=%s AND user_id=%s", (cart_id, get_mini_user_id()))
            item = cursor.fetchone()
            if not item:
                return jsonify({"code": 404, "msg": "购物车项不存在"}), 404

            # 更新数量
            if 'quantity' in data:
                cursor.execute(
                    "UPDATE mini_cart SET quantity=%s WHERE id=%s AND user_id=%s",
                    (data['quantity'], cart_id, get_mini_user_id())
                )

            # 更新配饰
            if 'accessories' in data:
                accessories_json = json.dumps(data['accessories'], ensure_ascii=False)
                cursor.execute(
                    "UPDATE mini_cart SET accessories=%s WHERE id=%s AND user_id=%s",
                    (accessories_json, cart_id, get_mini_user_id())
                )

            db.commit()
            return jsonify({"code": 200, "msg": "已更新"})
    finally:
        db.close()

@app.route('/api/mobile/cart/clear', methods=['POST'])
@mini_login_required
def mobile_cart_clear():
    """清空购物车"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM mini_cart WHERE user_id=%s", (get_mini_user_id(),))
            db.commit()
            return jsonify({"code": 200, "msg": "已清空"})
    finally:
        db.close()

# ---- 询价订单 ----

@app.route('/api/mobile/inquiry', methods=['POST'])
@mini_login_required
def mobile_inquiry_submit():
    """提交询价订单"""
    data = request.get_json() or {}
    print(f"[INQUIRY SUBMIT] data={data}", flush=True)
    user_name = data.get('user_name') or '未填写'
    user_phone = data.get('user_phone') or '未填写'
    address = data.get('address', '')
    remark = data.get('remark', '')
    items = data.get('items', [])
    print(f"[INQUIRY SUBMIT] items count={len(items)}", flush=True)
    for i, item in enumerate(items):
        print(f"[INQUIRY SUBMIT] item[{i}]={item}", flush=True)

    db = get_db()
    try:
        with db.cursor() as cursor:
            # 按 pindan_group_id 分组
            group_map = {}  # {group_id: {'name': group_name, 'items': []}}
            normal_items = []  # 无拼单ID的商品

            for item in items:
                pindan_group_id = item.get('pindan_group_id')
                if pindan_group_id:
                    gid = pindan_group_id
                    if gid not in group_map:
                        group_map[gid] = {
                            'name': item.get('pindan_group_name', '拼单'),
                            'items': []
                        }
                    group_map[gid]['items'].append(item)
                else:
                    normal_items.append(item)

            order_nos = []

            # 处理拼单组 - 每组一个订单
            for gid, group_data in group_map.items():
                total_amount = 0
                enriched_items = []
                for item in group_data['items']:
                    if item.get('item_type') == 'doll':
                        cursor.execute("SELECT name, price FROM doll WHERE id=%s", (item['item_id'],))
                        d = cursor.fetchone()
                        if d:
                            total_amount += float(d['price'] or 0)
                            enriched_items.append({'type': 'doll', 'id': item['item_id'], 'name': d['name'], 'price': float(d['price'] or 0)})
                    elif item.get('item_type') == 'accessory':
                        cursor.execute("SELECT name, price FROM accessory WHERE id=%s", (item['item_id'],))
                        a = cursor.fetchone()
                        if a:
                            total_amount += float(a['price'] or 0)
                            enriched_items.append({'type': 'accessory', 'id': item['item_id'], 'name': a['name'], 'price': float(a['price'] or 0)})
                    elif item.get('item_type') == 'outfit':
                        print(f"[INQUIRY SUBMIT] Processing outfit item: item_id={item.get('item_id')}, accessories={item.get('accessories')}", flush=True)
                        cursor.execute("SELECT name, doll_id, doll_name, accessories, total_price FROM outfit_template WHERE id=%s", (item['item_id'],))
                        o = cursor.fetchone()
                        if o:
                            total_amount += float(o['total_price'] or 0)
                            # 用户自定义配饰
                            user_accessories = item.get('accessories', [])
                            # 方案默认配饰
                            default_accessories = o.get('accessories', [])
                            if isinstance(default_accessories, str):
                                default_accessories = json.loads(default_accessories) if default_accessories else []
                            print(f"[INQUIRY SUBMIT] user_accessories={user_accessories}, default_accessories={default_accessories}", flush=True)
                            enriched_items.append({
                                'type': 'outfit',
                                'id': item['item_id'],
                                'name': o['name'],
                                'price': float(o['total_price'] or 0),
                                'dollId': o['doll_id'],
                                'dollName': o['doll_name'],
                                'accessories': user_accessories or [],
                                'defaultAccessories': default_accessories or []
                            })

                order_id = generate_uuid()
                order_no = generate_order_no()
                # 存储拼单组信息在remark中（格式：拼单名称）
                group_remark = group_data['name']
                cursor.execute("""
                    INSERT INTO inquiry_order (id, order_no, user_id, user_name, user_phone, address, items, total_amount, remark, status, is_pindan)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', 1)
                """, (order_id, order_no, get_mini_user_id(), user_name, user_phone, address, json.dumps(enriched_items, ensure_ascii=False), total_amount, group_remark))
                order_nos.append(order_no)

            # 处理普通商品 - 归为一个订单
            if normal_items:
                total_amount = 0
                enriched_items = []
                for item in normal_items:
                    if item.get('item_type') == 'doll':
                        cursor.execute("SELECT name, price FROM doll WHERE id=%s", (item['item_id'],))
                        d = cursor.fetchone()
                        if d:
                            total_amount += float(d['price'] or 0)
                            enriched_items.append({'type': 'doll', 'id': item['item_id'], 'name': d['name'], 'price': float(d['price'] or 0)})
                    elif item.get('item_type') == 'accessory':
                        cursor.execute("SELECT name, price FROM accessory WHERE id=%s", (item['item_id'],))
                        a = cursor.fetchone()
                        if a:
                            total_amount += float(a['price'] or 0)
                            enriched_items.append({'type': 'accessory', 'id': item['item_id'], 'name': a['name'], 'price': float(a['price'] or 0)})
                    elif item.get('item_type') == 'outfit':
                        print(f"[INQUIRY SUBMIT] Processing outfit item: item_id={item.get('item_id')}, accessories={item.get('accessories')}", flush=True)
                        cursor.execute("SELECT name, doll_id, doll_name, accessories, total_price FROM outfit_template WHERE id=%s", (item['item_id'],))
                        o = cursor.fetchone()
                        if o:
                            total_amount += float(o['total_price'] or 0)
                            # 用户自定义配饰
                            user_accessories = item.get('accessories', [])
                            # 方案默认配饰
                            default_accessories = o.get('accessories', [])
                            if isinstance(default_accessories, str):
                                default_accessories = json.loads(default_accessories) if default_accessories else []
                            print(f"[INQUIRY SUBMIT] user_accessories={user_accessories}, default_accessories={default_accessories}", flush=True)
                            enriched_items.append({
                                'type': 'outfit',
                                'id': item['item_id'],
                                'name': o['name'],
                                'price': float(o['total_price'] or 0),
                                'dollId': o['doll_id'],
                                'dollName': o['doll_name'],
                                'accessories': user_accessories or [],
                                'defaultAccessories': default_accessories or []
                            })

                order_id = generate_uuid()
                order_no = generate_order_no()
                cursor.execute("""
                    INSERT INTO inquiry_order (id, order_no, user_id, user_name, user_phone, address, items, total_amount, remark, status, is_pindan)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', 0)
                """, (order_id, order_no, get_mini_user_id(), user_name, user_phone, address, json.dumps(enriched_items, ensure_ascii=False), total_amount, remark))
                order_nos.append(order_no)

            # 只删除提交的购物车商品，而不是清空全部
            cart_item_ids = data.get('cart_item_ids', [])
            if cart_item_ids:
                placeholders = ','.join(['%s'] * len(cart_item_ids))
                cursor.execute(f"DELETE FROM mini_cart WHERE id IN ({placeholders}) AND user_id=%s", cart_item_ids + [get_mini_user_id()])
            db.commit()
            return jsonify({"code": 200, "msg": "询价单已提交", "data": {"order_nos": order_nos}})
    finally:
        db.close()

@app.route('/api/mobile/inquiry/list', methods=['GET'])
@mini_login_required
def mobile_inquiry_list():
    """我的询价订单列表"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total FROM inquiry_order WHERE user_id=%s", (get_mini_user_id(),))
            total = cursor.fetchone()['total']
            offset = (page - 1) * page_size
            cursor.execute("""
                SELECT id, order_no, user_name, user_phone, items, total_amount, status, remark, created_at
                FROM inquiry_order WHERE user_id=%s
                ORDER BY created_at DESC LIMIT %s OFFSET %s
            """, (get_mini_user_id(), page_size, offset))
            rows = cursor.fetchall()
            for r in rows:
                r['totalAmount'] = float(r['total_amount'] or 0)
                r['items'] = json.loads(r['items']) if isinstance(r['items'], str) else (r['items'] or [])
                r['createdAt'] = r['created_at'].strftime('%Y-%m-%d') if r.get('created_at') else ''
            return jsonify({"code": 200, "data": rows, "total": total, "page": page, "page_size": page_size})
    finally:
        db.close()

# ---- 浏览历史 ----

@app.route('/api/mobile/browse/history', methods=['GET'])
@mini_login_required
def mobile_browse_history():
    """浏览历史"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT h.id, h.item_type, h.item_id, h.created_at,
                    d.name as doll_name, d.price as doll_price, d.images as doll_images,
                    a.name as acc_name, a.price as acc_price, a.images as acc_images,
                    o.name as outfit_name, o.total_price as outfit_price, o.cover_image as outfit_image
                FROM mini_browse_history h
                LEFT JOIN doll d ON h.item_type='doll' AND h.item_id=d.id
                LEFT JOIN accessory a ON h.item_type='accessory' AND h.item_id=a.id
                LEFT JOIN outfit_template o ON h.item_type='outfit' AND h.item_id=o.id
                WHERE h.user_id=%s
                ORDER BY h.created_at DESC LIMIT 50
            """, (get_mini_user_id(),))
            rows = cursor.fetchall()
            result = []
            seen = set()
            for r in rows:
                key = f"{r['item_type']}-{r['item_id']}"
                if key in seen:
                    continue
                seen.add(key)
                item = {'id': r['id'], 'item_type': r['item_type'], 'item_id': r['item_id'], 'createdAt': r['created_at'].strftime('%Y-%m-%d') if r.get('created_at') else ''}
                if r['item_type'] == 'doll':
                    imgs = json.loads(r['doll_images']) if isinstance(r['doll_images'], str) else (r['doll_images'] or [])
                    item['name'] = r['doll_name']
                    item['price'] = float(r['doll_price'] or 0)
                    item['coverImage'] = imgs[0] if imgs else ''
                elif r['item_type'] == 'accessory':
                    imgs = json.loads(r['acc_images']) if isinstance(r['acc_images'], str) else (r['acc_images'] or [])
                    item['name'] = r['acc_name']
                    item['price'] = float(r['acc_price'] or 0)
                    item['coverImage'] = imgs[0] if imgs else ''
                elif r['item_type'] == 'outfit':
                    item['name'] = r['outfit_name']
                    item['price'] = float(r['outfit_price'] or 0)
                    item['coverImage'] = r['outfit_image'] or ''
                    item['accessories'] = []
                result.append(item)
            return jsonify({"code": 200, "data": result})
    finally:
        db.close()

@app.route('/api/mobile/browse/history', methods=['POST'])
@mini_login_required
def mobile_browse_history_add():
    """添加浏览记录"""
    data = request.get_json() or {}
    item_type = data.get('item_type')
    item_id = data.get('item_id')
    if not item_type or not item_id:
        return jsonify({"code": 400, "msg": "参数不完整"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            # 删除同商品旧记录
            cursor.execute("DELETE FROM mini_browse_history WHERE user_id=%s AND item_type=%s AND item_id=%s", (get_mini_user_id(), item_type, item_id))
            hist_id = generate_uuid()
            cursor.execute("INSERT INTO mini_browse_history (id, user_id, item_type, item_id) VALUES (%s, %s, %s, %s)", (hist_id, get_mini_user_id(), item_type, item_id))
            db.commit()
            return jsonify({"code": 200, "msg": "ok"})
    finally:
        db.close()

# ---- 用户自定义搭配方案 ----

@app.route('/api/mobile/outfit/categories', methods=['GET'])
@mini_login_required
def mobile_outfit_categories():
    """获取用户自定义搭配分类"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, name, created_at FROM mini_user_outfit_category WHERE user_id=%s ORDER BY created_at DESC", (get_mini_user_id(),))
            rows = cursor.fetchall()
            for r in rows:
                r['createdAt'] = r['created_at'].strftime('%Y-%m-%d') if r.get('created_at') else ''
            return jsonify({"code": 200, "data": rows})
    finally:
        db.close()

@app.route('/api/mobile/outfit/categories', methods=['POST'])
@mini_login_required
def mobile_outfit_category_create():
    """新增搭配分类"""
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"code": 400, "msg": "分类名称不能为空"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            cat_id = generate_uuid()
            cursor.execute("INSERT INTO mini_user_outfit_category (id, user_id, name) VALUES (%s, %s, %s)", (cat_id, get_mini_user_id(), name))
            db.commit()
            return jsonify({"code": 200, "data": {"id": cat_id, "name": name}})
    finally:
        db.close()

@app.route('/api/mobile/outfit/categories/<cat_id>', methods=['DELETE'])
@mini_login_required
def mobile_outfit_category_delete(cat_id):
    """删除搭配分类"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM mini_user_outfit WHERE category_id=%s AND user_id=%s", (cat_id, get_mini_user_id()))
            cursor.execute("DELETE FROM mini_user_outfit_category WHERE id=%s AND user_id=%s", (cat_id, get_mini_user_id()))
            db.commit()
            return jsonify({"code": 200, "msg": "已删除"})
    finally:
        db.close()

@app.route('/api/mobile/outfit/user-list', methods=['GET'])
@mini_login_required
def mobile_outfit_user_list():
    """用户自定义搭配方案列表"""
    category_id = request.args.get('category_id', '')
    db = get_db()
    try:
        with db.cursor() as cursor:
            if category_id:
                cursor.execute("SELECT id, category_id, name, doll_id, doll_name, accessories, total_price, cover_image FROM mini_user_outfit WHERE user_id=%s AND category_id=%s ORDER BY created_at DESC", (get_mini_user_id(), category_id))
            else:
                cursor.execute("SELECT id, category_id, name, doll_id, doll_name, accessories, total_price, cover_image FROM mini_user_outfit WHERE user_id=%s ORDER BY created_at DESC", (get_mini_user_id(),))
            rows = cursor.fetchall()
            for r in rows:
                if isinstance(r.get('accessories'), str):
                    r['accessories'] = json.loads(r['accessories']) if r['accessories'] else []
                r['totalPrice'] = float(r['total_price'] or 0)
            return jsonify({"code": 200, "data": rows})
    finally:
        db.close()

@app.route('/api/mobile/outfit/user-save', methods=['POST'])
@mini_login_required
def mobile_outfit_user_save():
    """保存用户搭配方案"""
    data = request.get_json() or {}
    outfit_id = data.get('id')
    category_id = data.get('category_id')
    name = data.get('name', '').strip()
    doll_id = data.get('doll_id', '')
    doll_name = data.get('doll_name', '')
    accessories = data.get('accessories', [])
    total_price = float(data.get('total_price', 0))
    cover_image = data.get('cover_image', '')

    if not category_id or not name:
        return jsonify({"code": 400, "msg": "参数不完整"})

    db = get_db()
    try:
        with db.cursor() as cursor:
            if outfit_id:
                cursor.execute("""
                    UPDATE mini_user_outfit SET name=%s, doll_id=%s, doll_name=%s, accessories=%s, total_price=%s, cover_image=%s
                    WHERE id=%s AND user_id=%s
                """, (name, doll_id, doll_name, json.dumps(accessories, ensure_ascii=False), total_price, cover_image, outfit_id, get_mini_user_id()))
            else:
                outfit_id = generate_uuid()
                cursor.execute("""
                    INSERT INTO mini_user_outfit (id, category_id, user_id, name, doll_id, doll_name, accessories, total_price, cover_image)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (outfit_id, category_id, get_mini_user_id(), name, doll_id, doll_name, json.dumps(accessories, ensure_ascii=False), total_price, cover_image))
            db.commit()
            return jsonify({"code": 200, "msg": "保存成功", "data": {"id": outfit_id}})
    finally:
        db.close()

@app.route('/api/mobile/outfit/user/<outfit_id>', methods=['DELETE'])
@mini_login_required
def mobile_outfit_user_delete(outfit_id):
    """删除用户搭配方案"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM mini_user_outfit WHERE id=%s AND user_id=%s", (outfit_id, get_mini_user_id()))
            db.commit()
            return jsonify({"code": 200, "msg": "已删除"})
    finally:
        db.close()

# ==================== 后台管理 - 小程序用户相关 ====================

@app.route('/api/admin/mini-user/register-list', methods=['GET'])
@admin_login_required
def admin_mini_user_register_list():
    """小程序注册申请列表"""
    status = request.args.get('status', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)

    db = get_db()
    try:
        with db.cursor() as cursor:
            where = "WHERE status IN ('pending', 'disabled')"
            params = []
            if status:
                where = "WHERE status=%s"
                params.append(status)

            cursor.execute(f"SELECT COUNT(*) as total FROM user {where}", params)
            total = cursor.fetchone()['total']

            offset = (page - 1) * page_size
            cursor.execute(f"SELECT id, openid, phone, nickname, avatar, status, created_at FROM user {where} ORDER BY created_at DESC LIMIT %s OFFSET %s", params + [page_size, offset])
            rows = cursor.fetchall()
            for r in rows:
                r['createdAt'] = r['created_at'].strftime('%Y-%m-%d %H:%M') if r.get('created_at') else ''
            return jsonify({"code": 200, "data": rows, "total": total, "page": page, "page_size": page_size})
    finally:
        db.close()

@app.route('/api/admin/mini-user/approve/<user_id>', methods=['POST'])
@admin_login_required
def admin_mini_user_approve(user_id):
    """审核通过注册申请"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE user SET status='active' WHERE id=%s AND status='pending'", (user_id,))
            db.commit()
            return jsonify({"code": 200, "msg": "已通过审核"})
    finally:
        db.close()

@app.route('/api/admin/mini-user/reject/<user_id>', methods=['POST'])
@admin_login_required
def admin_mini_user_reject(user_id):
    """审核拒绝注册申请"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE user SET status='disabled' WHERE id=%s AND status='pending'", (user_id,))
            db.commit()
            return jsonify({"code": 200, "msg": "已拒绝"})
    finally:
        db.close()

@app.route('/api/admin/doll/toggle-hot', methods=['POST'])
@admin_login_required
def admin_doll_toggle_hot():
    """切换娃娃热门状态"""
    data = request.get_json() or {}
    doll_id = data.get('id')
    if not doll_id:
        return jsonify({"code": 400, "msg": "id 不能为空"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE doll SET is_hot = CASE WHEN is_hot = 1 THEN 0 ELSE 1 END WHERE id=%s", (doll_id,))
            cursor.execute("SELECT is_hot FROM doll WHERE id=%s", (doll_id,))
            row = cursor.fetchone()
            db.commit()
            return jsonify({"code": 200, "msg": "操作成功", "data": {"is_hot": row['is_hot'] if row else 0}})
    finally:
        db.close()

@app.route('/api/admin/accessory/toggle-hot', methods=['POST'])
@admin_login_required
def admin_accessory_toggle_hot():
    """切换配饰热门状态"""
    data = request.get_json() or {}
    acc_id = data.get('id')
    if not acc_id:
        return jsonify({"code": 400, "msg": "id 不能为空"})
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("UPDATE accessory SET is_hot = CASE WHEN is_hot = 1 THEN 0 ELSE 1 END WHERE id=%s", (acc_id,))
            cursor.execute("SELECT is_hot FROM accessory WHERE id=%s", (acc_id,))
            row = cursor.fetchone()
            db.commit()
            return jsonify({"code": 200, "msg": "操作成功", "data": {"is_hot": row['is_hot'] if row else 0}})
    finally:
        db.close()


# ==================== 启动 ====================

if __name__ == '__main__':
    print("=" * 50)
    print("海亮布娃娃定制询价管理系统")
    print("后端服务启动中...")
    print("访问地址: http://localhost:5001")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
