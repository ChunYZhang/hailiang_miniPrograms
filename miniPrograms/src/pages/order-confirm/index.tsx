import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Button } from '@tarojs/components'
import { navigateBack, showToast, switchTab, navigateTo } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

interface Accessory {
  id: string
  name: string
  price: number
}

interface CartItem {
  id: string
  item_type: string
  item_id: string
  name: string
  price: number
  coverImage: string
  accessories: Accessory[]
  defaultAccessories?: Accessory[]
  pindan_group_id?: string
  pindan_group_name?: string
  quantity?: number
}

interface Address {
  id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  is_default: number
}

export default function OrderConfirmPage() {
  const { userInfo, setCartCount } = useGlobalState()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)

  useEffect(() => {
    // 获取选中的购物车商品ID
    const selectedStr = wx.getStorageSync('checkout_selected_ids')
    if (selectedStr) {
      setSelectedIds(JSON.parse(selectedStr))
    }
    loadData()
  }, [])

  const loadData = async () => {
    if (!userInfo) return
    setLoading(true)
    try {
      // 并行加载购物车和地址
      const [cartRes, addrRes] = await Promise.all([
        api.cart.list(),
        api.address.list(),
      ])

      const allItems = cartRes.data || []
      const addrList = addrRes.data || []

      // 过滤出选中的商品
      const selectedStr = wx.getStorageSync('checkout_selected_ids')
      const ids: string[] = selectedStr ? JSON.parse(selectedStr) : []
      const selectedItems = allItems.filter((item: any) => ids.includes(item.id))
      setCartItems(selectedItems)
      setAddresses(addrList)

      // 选中默认地址
      const defaultAddr = addrList.find((a: any) => a.is_default === 1)
      if (defaultAddr) {
        setSelectedAddress(defaultAddr)
      } else if (addrList.length > 0) {
        setSelectedAddress(addrList[0])
      }
    } catch (e) {
      console.error('加载数据失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddress(addr)
    setShowAddressModal(false)
  }

  const handleSubmit = async () => {
    if (!selectedAddress) {
      showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }
    if (cartItems.length === 0) {
      showToast({ title: '请选择商品', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const fullAddress = `${selectedAddress.province} ${selectedAddress.city} ${selectedAddress.district} ${selectedAddress.detail}`

      // 获取提交订单的购物车ID列表
      const cartItemIds = cartItems.map((item: any) => item.id)

      // 按拼单组分组的商品
      const pindanGroups = cartItems.filter(item => item.pindan_group_id && item.pindan_group_id.trim() !== '')
      const normalItems = cartItems.filter(item => !item.pindan_group_id || item.pindan_group_id.trim() === '')

      // 如果有拼单商品，按拼单组分别提交
      if (pindanGroups.length > 0) {
        const groupMap: Record<string, CartItem[]> = {}
        pindanGroups.forEach(item => {
          const gid = item.pindan_group_id || 'no-group'
          if (!groupMap[gid]) groupMap[gid] = []
          groupMap[gid].push(item)
        })

        for (const [groupId, items] of Object.entries(groupMap)) {
          const groupName = items[0]?.pindan_group_name || '拼单'
          await api.cart.submit({
            user_name: selectedAddress.name,
            user_phone: selectedAddress.phone,
            address: fullAddress,
            cart_item_ids: items.map((item: any) => item.id),
            items: items.map(item => ({
              item_type: item.item_type,
              item_id: item.item_id,
              pindan_group_id: item.pindan_group_id,
              pindan_group_name: item.pindan_group_name,
              accessories: item.accessories || [],
              defaultAccessories: item.defaultAccessories || [],
            })),
          })
          showToast({ title: `${groupName}已提交`, icon: 'success' })
        }
      }

      // 普通商品提交
      if (normalItems.length > 0) {
        await api.cart.submit({
          user_name: selectedAddress.name,
          user_phone: selectedAddress.phone,
          address: fullAddress,
          cart_item_ids: normalItems.map((item: any) => item.id),
          items: normalItems.map(item => ({
            item_type: item.item_type,
            item_id: item.item_id,
            accessories: item.accessories || [],
            defaultAccessories: item.defaultAccessories || [],
          })),
        })
      }

      // 清空选中状态和购物车
      wx.removeStorageSync('checkout_selected_ids')
      loadCart()
      showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => switchTab({ url: '/pages/cart/index' }), 1500)
    } catch (e: any) {
      showToast({ title: e.message || '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const loadCart = async () => {
    const res = await api.cart.list()
    setCartCount(res.data?.length || 0)
  }

  const totalPrice = cartItems.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0
    const accPrice = (item.accessories || []).reduce((s: number, acc: any) => s + Number(acc.price) || 0, 0)
    return sum + itemPrice + accPrice
  }, 0)

  const typeLabel: Record<string, string> = { doll: '娃娃', accessory: '配饰', outfit: '搭配' }

  if (loading) {
    return (
      <View className="page-loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className="page-order-confirm">
      {/* 收货地址 */}
      <View className="section-address" onClick={() => setShowAddressModal(true)}>
        {selectedAddress ? (
          <View className="address-info">
            <View className="address-main">
              <View className="address-contact">
                <Text className="contact-name">{selectedAddress.name}</Text>
                <Text className="contact-phone">{selectedAddress.phone}</Text>
              </View>
              <Text className="address-detail">
                {selectedAddress.province} {selectedAddress.city} {selectedAddress.district} {selectedAddress.detail}
              </Text>
            </View>
            <Text className="address-arrow">›</Text>
          </View>
        ) : (
          <View className="address-empty" onClick={() => navigateTo({ url: '/pages/address/edit' })}>
            <Text className="address-empty-text">请添加收货地址</Text>
            <Text className="address-arrow">›</Text>
          </View>
        )}
      </View>

      {/* 商品列表 */}
      <View className="section-goods">
        <View className="section-title">商品信息</View>
        <View className="goods-list">
          {cartItems.map(item => {
            const itemTotal = Number(item.price || 0) + Number((item.accessories || []).reduce((s: number, acc: any) => s + Number(acc.price || 0), 0))
            return (
              <View key={item.id} className="goods-item">
                <Image
                  className="goods-image"
                  src={item.coverImage || 'https://picsum.photos/80/80'}
                  mode="aspectFill"
                />
                <View className="goods-info">
                  <Text className="goods-name">{item.name}</Text>
                  <View className="goods-tags">
                    <Text className="goods-tag">{typeLabel[item.item_type] || item.item_type}</Text>
                    {item.pindan_group_id && (
                      <Text className="goods-tag pindan">拼单</Text>
                    )}
                  </View>
                  {item.accessories && item.accessories.length > 0 && (
                    <Text className="goods-accessories">
                      配饰: {item.accessories.map((acc: any) => acc.name).join(' + ')}
                    </Text>
                  )}
                </View>
                <View className="goods-right">
                  <Text className="goods-price">¥{itemTotal.toFixed(2)}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>

      {/* 底部提交栏 */}
      <View className="bottom-bar">
        <View className="total-info">
          <Text className="total-label">合计：</Text>
          <Text className="total-price">¥{totalPrice.toFixed(2)}</Text>
        </View>
        <View className={`submit-btn ${submitting ? 'disabled' : ''}`} onClick={submitting ? undefined : handleSubmit}>
          <Text className="submit-text">{submitting ? '提交中...' : '提交询价'}</Text>
        </View>
      </View>

      {/* 地址选择弹窗 */}
      {showAddressModal && (
        <View className="address-modal">
          <View className="modal-mask" onClick={() => setShowAddressModal(false)} />
          <View className="modal-content">
            <View className="modal-header">
              <Text className="modal-title">选择收货地址</Text>
              <View className="modal-close" onClick={() => setShowAddressModal(false)}>✕</View>
            </View>
            <ScrollView scrollY className="modal-body">
              {addresses.length === 0 ? (
                <View className="empty-tip">
                  <Text className="empty-text">暂无收货地址</Text>
                </View>
              ) : (
                addresses.map(addr => (
                  <View
                    key={addr.id}
                    className={`address-option ${selectedAddress?.id === addr.id ? 'selected' : ''}`}
                    onClick={() => handleSelectAddress(addr)}
                  >
                    <View className="option-info">
                      <View className="option-contact">
                        <Text className="option-name">{addr.name}</Text>
                        <Text className="option-phone">{addr.phone}</Text>
                        {addr.is_default === 1 && <Text className="option-default">默认</Text>}
                      </View>
                      <Text className="option-address">
                        {addr.province} {addr.city} {addr.district} {addr.detail}
                      </Text>
                    </View>
                    {selectedAddress?.id === addr.id && (
                      <Text className="option-check">✓</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            <View className="modal-footer">
              <Button className="add-address-btn" onClick={() => { setShowAddressModal(false); navigateTo({ url: '/pages/address/edit' }) }}>
                <Text className="add-address-text">新增地址</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
