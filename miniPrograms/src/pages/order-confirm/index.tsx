import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Button, Textarea } from '@tarojs/components'
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
  quantity: number
  minQuantity?: number
  smallBoxCapacity?: number
  mediumBoxCapacity?: number
  largeBoxCapacity?: number
  boxSize?: string
  accessories: Accessory[]
  defaultAccessories?: Accessory[]
  defaultAccessory?: string
  pindan_group_id?: string
  pindan_group_name?: string
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
  const [remark, setRemark] = useState('')

  useEffect(() => {
    const selectedStr = wx.getStorageSync('checkout_selected_ids')
    if (selectedStr) {
      setSelectedIds(JSON.parse(selectedStr))
    }
    const savedRemark = wx.getStorageSync('checkout_remark') || ''
    setRemark(savedRemark)
    loadData()
  }, [])

  const loadData = async () => {
    if (!userInfo) return
    setLoading(true)
    try {
      const [cartRes, addrRes] = await Promise.all([
        api.cart.list(),
        api.address.list(),
      ])

      const allItems = cartRes.data || []
      const addrList = addrRes.data || []

      const selectedStr = wx.getStorageSync('checkout_selected_ids')
      const ids: string[] = selectedStr ? JSON.parse(selectedStr) : []
      const selectedItems = allItems.filter((item: any) => ids.includes(item.id))
      setCartItems(selectedItems)
      setAddresses(addrList)

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
      const cartItemIds = cartItems.map((item: any) => item.id)

      const pindanGroups = cartItems.filter(item => item.pindan_group_id && item.pindan_group_id.trim() !== '')
      const normalItems = cartItems.filter(item => !item.pindan_group_id || item.pindan_group_id.trim() === '')

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
            remark: remark,
            cart_item_ids: items.map((item: any) => item.id),
            items: items.map(item => ({
              item_type: item.item_type,
              item_id: item.item_id,
              pindan_group_id: item.pindan_group_id,
              pindan_group_name: item.pindan_group_name,
              quantity: item.quantity,
              boxSize: item.boxSize,
              price: item.price,
              defaultAccessory: item.defaultAccessory,
              accessories: item.accessories || [],
              defaultAccessories: item.defaultAccessories || [],
            })),
          })
          showToast({ title: `${groupName}已提交`, icon: 'success' })
        }
      }

      if (normalItems.length > 0) {
        await api.cart.submit({
          user_name: selectedAddress.name,
          user_phone: selectedAddress.phone,
          address: fullAddress,
          remark: remark,
          cart_item_ids: normalItems.map((item: any) => item.id),
          items: normalItems.map(item => ({
            item_type: item.item_type,
            item_id: item.item_id,
            quantity: item.quantity,
            boxSize: item.boxSize,
            price: item.price,
            defaultAccessory: item.defaultAccessory,
            accessories: item.accessories || [],
            defaultAccessories: item.defaultAccessories || [],
          })),
        })
      }

      wx.removeStorageSync('checkout_selected_ids')
      wx.removeStorageSync('checkout_remark')
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
    return sum + (itemPrice + accPrice) * (Number(item.quantity) || 1)
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

      <View className="section-goods">
        <View className="section-title">商品信息</View>
        <View className="goods-list">
          {cartItems.map(item => {
            const itemTotal = (Number(item.price || 0) + Number((item.accessories || []).reduce((s: number, acc: any) => s + Number(acc.price) || 0, 0))) * (Number(item.quantity) || 1)
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
                    {item.boxSize && (
                      <Text className="goods-tag">{item.boxSize === 'small' ? '小箱' : item.boxSize === 'medium' ? '中箱' : item.boxSize === 'large' ? '大箱' : item.boxSize}</Text>
                    )}
                  </View>
                  {item.defaultAccessory && (
                    <Text className="goods-accessories">默认配饰: {item.defaultAccessory}</Text>
                  )}
                  {item.accessories && item.accessories.length > 0 && (
                    <Text className="goods-accessories">
                      搭配配饰: {item.accessories.map((acc: any) => acc.name).join(' + ')}
                    </Text>
                  )}
                  <Text className="goods-quantity">数量: {item.quantity}个</Text>
                </View>
                <View className="goods-right">
                  <Text className="goods-price">¥{itemTotal.toFixed(2)}</Text>
                  <Text className="goods-unit-price">单价: ¥{(Number(item.price) || 0).toFixed(2)}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>

      <View className="section-remark">
        <View className="section-title">备注</View>
        <Textarea
          className="remark-input"
          placeholder="请输入备注（如有拼单超出容量会已自动添加）"
          value={remark}
          onInput={(e: any) => setRemark(e.detail.value)}
          autoHeight
        />
      </View>

      <View className="bottom-bar">
        <View className="total-info">
          <Text className="total-label">合计：</Text>
          <Text className="total-price">¥{totalPrice.toFixed(2)}</Text>
        </View>
        <View className={`submit-btn ${submitting ? 'disabled' : ''}`} onClick={submitting ? undefined : handleSubmit}>
          <Text className="submit-text">{submitting ? '提交中...' : '提交询价'}</Text>
        </View>
      </View>

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
