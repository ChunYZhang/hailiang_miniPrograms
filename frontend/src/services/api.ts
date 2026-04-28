/**
 * API 服务层 - 统一封装所有后端 API 调用
 * 生产环境通过 Nginx 反向代理到 /api/
 */
const BASE_URL = '';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  credentials?: boolean;
}

async function request<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, credentials = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: credentials ? 'include' : 'omit',
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, config);
  const data = await res.json();

  if (data.code === 401) {
    sessionStorage.removeItem('admin_id');
    // 不立即跳转，让路由守卫处理
    throw new Error('请先登录');
  }

  if (data.code !== 200) {
    throw new Error(data.msg || '请求失败');
  }

  return data;
}

// ==================== 认证 ====================

export const api = {
  // 管理员登录
  login: (username: string, password: string) =>
    request<{ id: string; username: string; role: string; email: string }>('/api/admin/login', {
      method: 'POST',
      body: { username, password },
      credentials: true,  // 登录请求也需要发送credentials，以便保存session cookie
    }),

  // 退出登录
  logout: () => request('/api/admin/logout', { method: 'POST' }),

  // 获取管理员信息
  getAdminInfo: () =>
    request<{ id: string; username: string; role: string }>('/api/admin/info'),

  // ==================== 娃娃管理 ====================
  doll: {
    list: (params?: { keyword?: string; status?: string; series?: string; page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.keyword) search.set('keyword', params.keyword);
      if (params?.status) search.set('status', params.status);
      if (params?.series) search.set('series', params.series);
      if (params?.page) search.set('page', String(params.page));
      if (params?.page_size) search.set('page_size', String(params.page_size));
      const qs = search.toString();
      return request<{ data: any[]; total: number }>(`/api/admin/doll/list${qs ? '?' + qs : ''}`);
    },
    create: (data: any) => request('/api/admin/doll/create', { method: 'POST', body: data }),
    update: (data: any) => request('/api/admin/doll/update', { method: 'POST', body: data }),
    delete: (id: string) => request('/api/admin/doll/delete', { method: 'POST', body: { id } }),
    toggleStatus: (id: string) => request('/api/admin/doll/toggle-status', { method: 'POST', body: { id } }),
    toggleHot: (id: string) => request('/api/admin/doll/toggle-hot', { method: 'POST', body: { id } }),
  },

  // ==================== 配饰管理 ====================
  accessory: {
    list: (params?: { keyword?: string; category?: string; page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.keyword) search.set('keyword', params.keyword);
      if (params?.category) search.set('category', params.category);
      if (params?.page) search.set('page', String(params.page));
      if (params?.page_size) search.set('page_size', String(params.page_size));
      const qs = search.toString();
      return request<{ data: any[]; total: number }>(`/api/admin/accessory/list${qs ? '?' + qs : ''}`);
    },
    create: (data: any) => request('/api/admin/accessory/create', { method: 'POST', body: data }),
    update: (data: any) => request('/api/admin/accessory/update', { method: 'POST', body: data }),
    delete: (id: string) => request('/api/admin/accessory/delete', { method: 'POST', body: { id } }),
    toggleStatus: (id: string) => request('/api/admin/accessory/toggle-status', { method: 'POST', body: { id } }),
    toggleHot: (id: string) => request('/api/admin/accessory/toggle-hot', { method: 'POST', body: { id } }),
  },

  // ==================== 系列管理 ====================
  series: {
    list: () => request<{ data: any[] }>('/api/admin/series/list'),
    create: (data: any) => request('/api/admin/series/create', { method: 'POST', body: data }),
    update: (data: any) => request('/api/admin/series/update', { method: 'POST', body: data }),
    delete: (id: string) => request('/api/admin/series/delete', { method: 'POST', body: { id } }),
  },

  // ==================== 分类管理 ====================
  category: {
    list: () => request<{ data: any[] }>('/api/admin/category/list'),
    create: (data: any) => request('/api/admin/category/create', { method: 'POST', body: data }),
    update: (data: any) => request('/api/admin/category/update', { method: 'POST', body: data }),
    delete: (id: string) => request('/api/admin/category/delete', { method: 'POST', body: { id } }),
  },

  // ==================== 搭配方案 ====================
  outfit: {
    list: (params?: { page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set('page', String(params.page));
      if (params?.page_size) search.set('page_size', String(params.page_size));
      const qs = search.toString();
      return request<{ data: any[]; total: number }>(`/api/admin/outfit/list${qs ? '?' + qs : ''}`);
    },
    create: (data: any) => request('/api/admin/outfit/create', { method: 'POST', body: data }),
    update: (data: any) => request('/api/admin/outfit/update', { method: 'POST', body: data }),
    delete: (id: string) => request('/api/admin/outfit/delete', { method: 'POST', body: { id } }),
    toggleHot: (id: string) => request('/api/admin/outfit/toggle-hot', { method: 'POST', body: { id } }),
  },

  // ==================== 询价订单 ====================
  inquiry: {
    list: (params?: { status?: string; keyword?: string; page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.keyword) search.set('keyword', params.keyword);
      if (params?.page) search.set('page', String(params.page));
      if (params?.page_size) search.set('page_size', String(params.page_size));
      const qs = search.toString();
      return request<{ data: any[]; total: number }>(`/api/admin/inquiry/list${qs ? '?' + qs : ''}`);
    },
    detail: (id: string) => request<{ data: any }>(`/api/admin/inquiry/detail/${id}`),
    updateStatus: (data: { id: string; status: string; adminNote?: string }) =>
      request('/api/admin/inquiry/update-status', { method: 'POST', body: data }),
    followUp: (id: string) => request<{ data: any[] }>(`/api/admin/inquiry/follow-up/${id}`),
  },

  // ==================== 用户管理 ====================
  user: {
    list: (params?: { keyword?: string; status?: string; page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.keyword) search.set('keyword', params.keyword);
      if (params?.status) search.set('status', params.status);
      if (params?.page) search.set('page', String(params.page));
      if (params?.page_size) search.set('page_size', String(params.page_size));
      const qs = search.toString();
      return request<{ data: any[]; total: number }>(`/api/admin/user/list${qs ? '?' + qs : ''}`);
    },
    create: (data: { phone?: string; nickname?: string; avatar?: string; region?: string; registerIp?: string }) =>
      request('/api/admin/user/create', { method: 'POST', body: data }),
    update: (data: { id: string; phone?: string; nickname?: string; avatar?: string; region?: string; status?: string }) =>
      request('/api/admin/user/update', { method: 'POST', body: data }),
    delete: (id: string) => request('/api/admin/user/delete', { method: 'POST', body: { id } }),
    toggleStatus: (id: string) => request('/api/admin/user/toggle-status', { method: 'POST', body: { id } }),
  },

  // ==================== 库存管理 ====================
  inventory: {
    overview: () => request<{ data: any }>('/api/admin/inventory/overview'),
    products: () => request<{ data: any[] }>('/api/admin/inventory/products'),
    records: (params?: { type?: string; page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.type) search.set('type', params.type);
      if (params?.page) search.set('page', String(params.page));
      if (params?.page_size) search.set('page_size', String(params.page_size));
      const qs = search.toString();
      return request<{ data: any[]; total: number }>(`/api/admin/inventory/records${qs ? '?' + qs : ''}`);
    },
    addRecord: (data: any) => request('/api/admin/inventory/add-record', { method: 'POST', body: data }),
  },

  // ==================== 数据报表 ====================
  report: {
    dashboard: () => request<{ data: any }>('/api/admin/report/dashboard'),
    chartData: (days?: number) =>
      request<{ data: any }>(`/api/admin/report/chart-data?days=${days || 7}`),
  },

  // ==================== 企业信息 ====================
  company: {
    get: () => request<{ data: any }>('/api/admin/company/info'),
    save: (data: any) => request('/api/admin/company/info', { method: 'POST', body: data }),
  },

  // ==================== 资质证书管理 ====================
  certificate: {
    list: () => request<{ data: any[] }>('/api/admin/certificate/list'),
    create: (data: any) => request('/api/admin/certificate/create', { method: 'POST', body: data }),
    update: (data: any) => request('/api/admin/certificate/update', { method: 'POST', body: data }),
    delete: (id: string) => request('/api/admin/certificate/delete', { method: 'POST', body: { id } }),
  },

  // ==================== Banner管理 ====================
  banner: {
    list: () => request<{ data: any[] }>('/api/admin/banner/list'),
    create: (data: any) => request('/api/admin/banner/create', { method: 'POST', body: data }),
    update: (data: any) => request('/api/admin/banner/update', { method: 'POST', body: data }),
    delete: (id: string) => request('/api/admin/banner/delete', { method: 'POST', body: { id } }),
    toggleStatus: (id: string) => request('/api/admin/banner/toggle-status', { method: 'POST', body: { id } }),
  },

  // ==================== 邮件配置 ====================
  emailConfig: {
    get: () => request<{ data: any }>('/api/admin/email-config'),
    save: (data: any) => request('/api/admin/email-config', { method: 'POST', body: data }),
  },

  // ==================== 小程序用户管理 ====================
  miniUser: {
    registerList: (params?: { status?: string; page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.page) search.set('page', String(params.page));
      if (params?.page_size) search.set('page_size', String(params.page_size));
      const qs = search.toString();
      return request<{ data: any[]; total: number }>(`/api/admin/mini-user/register-list${qs ? '?' + qs : ''}`);
    },
    approve: (id: string) => request('/api/admin/mini-user/approve/' + id, { method: 'POST' }),
    reject: (id: string) => request('/api/admin/mini-user/reject/' + id, { method: 'POST' }),
  },

  // ==================== 管理员账号 ====================
  admin: {
    list: () => request<{ data: any[] }>('/api/admin/admin/list'),
    create: (data: any) => request('/api/admin/admin/create', { method: 'POST', body: data }),
    update: (data: any) => request('/api/admin/admin/update', { method: 'POST', body: data }),
    toggleStatus: (id: string) => request('/api/admin/admin/toggle-status', { method: 'POST', body: { id } }),
    changePassword: (oldPassword: string, newPassword: string) =>
      request('/api/admin/admin/change-password', {
        method: 'POST',
        body: { oldPassword, newPassword },
      }),
  },

  // ==================== 系统日志 ====================
  log: {
    list: (params?: { page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set('page', String(params.page));
      if (params?.page_size) search.set('page_size', String(params.page_size));
      const qs = search.toString();
      return request<{ data: any[]; total: number }>(`/api/admin/log/list${qs ? '?' + qs : ''}`);
    },
  },

  // ==================== 文件上传 ====================
  upload: {
    image: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE_URL}/api/upload/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.code !== 200) throw new Error(data.msg || '上传失败');
      return data.data.url as string;
    },
  },
};
