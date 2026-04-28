import { apiBaseUrl } from '../styles'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  credentials?: boolean
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, credentials = true } = options

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const config: any = {
    method,
    header,
  }

  if (credentials) {
    // @ts-ignore
    config.header['X-Token'] = wx.getStorageSync('mini_token') || wx.getStorageSync('mini_openid') || ''
  }

  if (body && method !== 'GET') {
    config.data = JSON.stringify(body)
  }

  return new Promise((resolve, reject) => {
    const task = wx.request({
      url: `${apiBaseUrl}${path}`,
      ...config,
      timeout: 15000,
      success: (res: any) => {
        console.log('API Success:', path, res)
        const data = res.data
        if (!data) {
          reject(new Error('服务器无响应'))
          return
        }
        if (data.code === 401) {
          wx.removeStorageSync('mini_user_id')
          wx.removeStorageSync('session')
          reject(new Error('请先登录'))
          return
        }
        if (data.code !== 200) {
          reject(new Error(data.msg || '请求失败'))
          return
        }
        resolve(data)
      },
      fail: (err: any) => {
        console.error('API Fail:', path, err)
        reject(new Error('网络连接失败'))
      },
    })
  })
}

async function get<T = any>(path: string): Promise<T> {
  return request<T>(path)
}

async function post<T = any>(path: string, data?: any): Promise<T> {
  return request<T>(path, { method: 'POST', body: data })
}

async function del<T = any>(path: string, body?: any): Promise<T> {
  return request<T>(path, { method: 'DELETE', body })
}

export const api = {
  // 公开接口
  home: {
    banners: () => get<any[]>('/api/mobile/home/banners'),
    recommended: () => get<any>('/api/mobile/home/recommended'),
  },
  series: {
    list: () => get<any[]>('/api/mobile/series/list'),
  },
  category: {
    list: () => get<any[]>('/api/mobile/category/list'),
  },
  doll: {
    list: (params?: { series?: string; keyword?: string; page?: number; page_size?: number }) => {
      const search = new URLSearchParams()
      if (params?.series) search.set('series', params.series)
      if (params?.keyword) search.set('keyword', params.keyword)
      if (params?.page) search.set('page', String(params.page))
      if (params?.page_size) search.set('page_size', String(params.page_size))
      const qs = search.toString()
      return get<any>(`/api/mobile/doll/list${qs ? '?' + qs : ''}`)
    },
    detail: (id: string) => get<any>(`/api/mobile/doll/detail/${id}`),
    outfitAccessories: (dollId: string) => get<any>(`/api/mobile/doll/${dollId}/outfit-accessories`),
  },
  accessory: {
    list: (params?: { category?: string; series?: string; keyword?: string; page?: number; page_size?: number }) => {
      const search = new URLSearchParams()
      if (params?.category) search.set('category', params.category)
      if (params?.series) search.set('series', params.series)
      if (params?.keyword) search.set('keyword', params.keyword)
      if (params?.page) search.set('page', String(params.page))
      if (params?.page_size) search.set('page_size', String(params.page_size))
      const qs = search.toString()
      return get<any>(`/api/mobile/accessory/list${qs ? '?' + qs : ''}`)
    },
    detail: (id: string) => get<any>(`/api/mobile/accessory/detail/${id}`),
  },
  outfit: {
    list: () => get<any[]>('/api/mobile/outfit/list'),
    detail: (id: string) => get<any>(`/api/mobile/outfit/detail/${id}`),
    categories: () => get<any[]>('/api/mobile/outfit/categories'),
    userList: (params?: { category_id?: string }) => {
      const search = new URLSearchParams()
      if (params?.category_id) search.set('category_id', params.category_id)
      const qs = search.toString()
      return get<any[]>(`/api/mobile/outfit/user-list${qs ? '?' + qs : ''}`)
    },
    createCategory: (data: any) => post('/api/mobile/outfit/categories', data),
    deleteCategory: (id: string) => del(`/api/mobile/outfit/categories/${id}`),
    saveOutfit: (data: any) => post('/api/mobile/outfit/user-save', data),
    deleteOutfit: (id: string) => del(`/api/mobile/outfit/user/${id}`),
  },
  // 用户认证
  auth: {
    login: (data: { openid: string; nickname: string; avatar: string; phone?: string; code?: string }) => post<any>('/api/mobile/auth/login', data),
    decryptPhone: (data: { encryptedData: string; iv: string; code: string }) => post<any>('/api/mobile/auth/decrypt-phone', data),
    loginByPassword: (data: { phone: string; password: string }) => post<any>('/api/mobile/auth/login-by-password', data),
    registerApply: (data: { openid?: string; phone: string; password?: string }) => post<any>('/api/mobile/auth/register-apply', data),
    profile: () => get<any>('/api/mobile/auth/profile'),
    updateProfile: (data: any) => post('/api/mobile/auth/profile', data),
    logout: () => post('/api/mobile/auth/logout'),
  },
  // 收藏
  favorites: {
    list: () => get<any[]>('/api/mobile/favorites'),
    add: (data: { item_type: string; item_id: string }) => post('/api/mobile/favorites', data),
    remove: (id: string) => del(`/api/mobile/favorites/${id}`),
    removeByItem: (data: { item_type: string; item_id: string }) => del('/api/mobile/favorites/by-item', data),
  },
  // 购物车
  cart: {
    list: () => get<any[]>('/api/mobile/cart'),
    add: (data: { item_type: string; item_id: string; accessories?: any[]; quantity?: number; pindan_group_id?: string; pindan_group_name?: string }) => post('/api/mobile/cart', data),
    remove: (id: string) => del(`/api/mobile/cart/${id}`),
    clear: () => post('/api/mobile/cart/clear'),
    submit: (data: { user_name: string; user_phone: string; address?: string; remark?: string; items: any[], cart_item_ids?: string[] }) =>
      post<any>('/api/mobile/inquiry', data),
  },
  // 询价订单
  inquiry: {
    list: (params?: { page?: number; page_size?: number }) => {
      const search = new URLSearchParams()
      if (params?.page) search.set('page', String(params.page))
      if (params?.page_size) search.set('page_size', String(params.page_size))
      const qs = search.toString()
      return get<any>(`/api/mobile/inquiry/list${qs ? '?' + qs : ''}`)
    },
  },
  // 浏览历史
  browse: {
    history: () => get<any[]>('/api/mobile/browse/history'),
    add: (data: { item_type: string; item_id: string }) => post('/api/mobile/browse/history', data),
  },
  // 收货地址
  address: {
    list: () => get<any[]>('/api/mobile/address/list'),
    create: (data: { name: string; phone: string; province: string; city: string; district?: string; detail: string; is_default?: number }) =>
      post('/api/mobile/address/create', data),
    update: (data: { id: string; name: string; phone: string; province: string; city: string; district?: string; detail: string; is_default?: number }) =>
      post('/api/mobile/address/update', data),
    delete: (id: string) => post('/api/mobile/address/delete', { id }),
    setDefault: (id: string) => post('/api/mobile/address/set-default', { id }),
  },

  // 公司信息
  company: {
    info: () => get<any>('/api/mobile/company/info'),
    certificates: () => get<any[]>('/api/mobile/company/certificates'),
  },
}
