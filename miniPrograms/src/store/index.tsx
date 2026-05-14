import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface Accessory {
  id: string
  name: string
  price: number
}

interface PindanItem {
  id: string
  itemType: 'doll' | 'accessory' | 'outfit'
  itemId: string
  name: string
  price: number
  accessoriesPrice: number
  coverImage: string
  quantity: number
  accessories: Accessory[]
  minQuantity: number
  pindanGroupId: string
  pindanGroupName: string
  boxSize?: 'small' | 'medium' | 'large'
  smallBoxCapacity?: number
  mediumBoxCapacity?: number
  largeBoxCapacity?: number
}

interface UserInfo {
  id: string
  nickname: string
  avatar: string
  phone: string
  region?: string
}

interface GlobalState {
  userInfo: UserInfo | null
  cartCount: number
  companyName: string
  setUserInfo: (u: UserInfo | null) => void
  setCartCount: (n: number) => void
  setCompanyName: (name: string) => void
  // pindan related
  isPindanMode: boolean
  pindanItems: PindanItem[]
  enterPindanMode: () => void
  exitPindanMode: () => void
  addToPindan: (item: PindanItem) => void
  updatePindanItemQuantity: (itemId: string, quantity: number) => void
  removeFromPindan: (itemId: string) => void
  clearPindan: () => void
  createPindanGroup: () => { groupId: string; groupName: string }
}

const GlobalContext = createContext<GlobalState>({
  userInfo: null,
  cartCount: 0,
  companyName: '海亮布娃娃',
  setUserInfo: () => {},
  setCartCount: () => {},
  setCompanyName: () => {},
  isPindanMode: false,
  pindanItems: [],
  enterPindanMode: () => {},
  exitPindanMode: () => {},
  addToPindan: () => {},
  updatePindanItemQuantity: () => {},
  removeFromPindan: () => {},
  clearPindan: () => {},
  createPindanGroup: () => ({ groupId: '', groupName: '' }),
})

export function useGlobalState(): GlobalState {
  return useContext(GlobalContext)
}

export function GlobalProvider({ children }: { children: any }) {
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null)
  const [cartCount, setCartCountState] = useState(0)
  const [companyName, setCompanyNameState] = useState('海亮布娃娃')
  const [isPindanMode, setIsPindanMode] = useState(false)
  const [pindanItems, setPindanItems] = useState<PindanItem[]>([])

  useEffect(() => {
    const stored = wx.getStorageSync('mini_user_info')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        if (user?.id) {
          setUserInfoState(user)
        }
      } catch (e) {}
    }
    const storedCart = wx.getStorageSync('cart_count')
    if (storedCart) {
      setCartCountState(Number(storedCart))
    }
    const storedCompany = wx.getStorageSync('company_name')
    if (storedCompany) {
      setCompanyNameState(storedCompany)
    }
  }, [])

  const clearLogin = useCallback(() => {
    setUserInfoState(null)
    wx.removeStorageSync('mini_user_info')
    wx.removeStorageSync('mini_user_id')
    wx.removeStorageSync('mini_openid')
  }, [])

  const setUserInfo = useCallback((u: UserInfo | null) => {
    setUserInfoState(u)
    if (u) {
      wx.setStorageSync('mini_user_info', JSON.stringify(u))
    } else {
      wx.removeStorageSync('mini_user_info')
    }
  }, [])

  const setCartCount = useCallback((n: number) => {
    setCartCountState(n)
    wx.setStorageSync('cart_count', String(n))
  }, [])

  const setCompanyName = useCallback((name: string) => {
    setCompanyNameState(name)
    wx.setStorageSync('company_name', name)
  }, [])

  const enterPindanMode = useCallback(() => {
    setIsPindanMode(true)
  }, [])

  const exitPindanMode = useCallback(() => {
    setIsPindanMode(false)
  }, [])

  const addToPindan = useCallback((item: PindanItem) => {
    setPindanItems(prev => {
      const existing = prev.find(i => i.itemId === item.itemId)
      if (existing) {
        return prev.map(i =>
          i.itemId === item.itemId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const updatePindanItemQuantity = useCallback((pindanItemId: string, quantity: number) => {
    setPindanItems(prev =>
      prev.map(i =>
        i.itemId === pindanItemId ? { ...i, quantity } : i
      )
    )
  }, [])

  const removeFromPindan = useCallback((itemId: string) => {
    setPindanItems(prev => prev.filter(i => i.itemId !== itemId))
  }, [])

  const clearPindan = useCallback(() => {
    setPindanItems([])
    setIsPindanMode(false)
  }, [])

  // 生成拼单组ID和名称
  const createPindanGroup = useCallback((nickname?: string) => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    const dateStr = `${yyyy}年${mm}月${dd}日${hh}时${min}分`
    const dateCode = `${mm}${dd}${hh}${min}`
    const fullStr = `${yyyy}${mm}${dd}${hh}${min}${ss}`
    // 昵称缩写（取每个字拼音首字母大写）
    let nicknameAbbr = 'U'
    if (nickname) {
      nicknameAbbr = nickname.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'U'
    }
    const groupId = `pindan_${nicknameAbbr}_${fullStr}`
    const groupName = dateStr
    return { groupId, groupName }
  }, [])

  return (
    <GlobalContext.Provider
      value={{
        userInfo,
        cartCount,
        companyName,
        setUserInfo,
        setCartCount,
        setCompanyName,
        isPindanMode,
        pindanItems,
        enterPindanMode,
        exitPindanMode,
        addToPindan,
        updatePindanItemQuantity,
        removeFromPindan,
        clearPindan,
        createPindanGroup,
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}
