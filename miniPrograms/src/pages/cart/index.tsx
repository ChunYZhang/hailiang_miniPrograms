import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { showToast, showModal, useDidShow, navigateTo } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

interface Accessory {
  id: string
  name: string
  price: number
  images?: string[]
}

interface CartItem {
  id: string
  item_type: string
  item_id: string
  name: string
  price: number
  coverImage: string
  accessories: Accessory[]
  pindan_group_id?: string
  pindan_group_name?: string
}

interface CartGroup {
  groupId: string
  groupName: string
  items: CartItem[]
  totalQuantity: number
}

export default function CartPage() {
  const { userInfo, setCartCount } = useGlobalState()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 配饰编辑弹窗状态
  const [showAccessoryModal, setShowAccessoryModal] = useState(false)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [allAccessories, setAllAccessories] = useState<Accessory[]>([])
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([])

  // 每次页面显示时刷新购物车数据
  useDidShow(() => {
    if (userInfo) loadCart()
  })

  const loadCart = async () => {
    if (!userInfo) return
    setLoading(true)
    try {
      const res = await api.cart.list()
      setCartItems(res.data || [])
      setSelectedIds((res.data || []).map((item: any) => item.id))
    } catch (e) {
      console.error('加载购物车失败', e)
    } finally {
      setLoading(false)
    }
  }

  const loadAllAccessories = async () => {
    try {
      const res = await api.accessory.list({ page_size: 100 })
      setAllAccessories(res.data || [])
    } catch (e) {
      console.error('加载配饰失败', e)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(cartItems.map(item => item.id))
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await api.cart.remove(id)
      showToast({ title: '已删除', icon: 'success' })
      loadCart()
      const res = await api.cart.list()
      setCartCount(res.data?.length || 0)
    } catch (e: any) {
      showToast({ title: e.message || '删除失败', icon: 'none' })
    }
  }

  const handleClear = async () => {
    const res = await showModal({ title: '确认清空购物车？' })
    if (res.confirm) {
      try {
        await api.cart.clear()
        setCartItems([])
        setSelectedIds([])
        setCartCount(0)
        showToast({ title: '已清空', icon: 'success' })
      } catch (e) {}
    }
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      showToast({ title: '请选择要询价的商品', icon: 'none' })
      return
    }
    const selectedItems = cartItems.filter(item => selectedIds.includes(item.id))
    if (selectedItems.length === 0) {
      showToast({ title: '请选择要询价的商品', icon: 'none' })
      return
    }

    // 保存选中的商品ID，跳转到订单确认页
    wx.setStorageSync('checkout_selected_ids', JSON.stringify(selectedIds))
    navigateTo({ url: '/pages/order-confirm/index' })
  }

  // 打开配饰编辑弹窗
  const handleEditAccessories = async (item: CartItem) => {
    setEditingItem(item)
    setSelectedAccessoryIds(item.accessories?.map(acc => acc.id) || [])
    await loadAllAccessories()
    setShowAccessoryModal(true)
  }

  const handleAccessoryConfirm = async () => {
    if (!editingItem) return
    try {
      const selectedAccessories = allAccessories
        .filter(acc => selectedAccessoryIds.includes(acc.id))
        .map(acc => ({ id: acc.id, name: acc.name, price: acc.price }))

      // 删除旧记录
      await api.cart.remove(editingItem.id)
      // 添加新记录
      await api.cart.add({
        item_type: editingItem.item_type,
        item_id: editingItem.item_id,
        accessories: selectedAccessories,
        pindan_group_id: editingItem.pindan_group_id,
        pindan_group_name: editingItem.pindan_group_name,
      })
      showToast({ title: '已更新', icon: 'success' })
      setShowAccessoryModal(false)
      setEditingItem(null)
      loadCart()
    } catch (e: any) {
      showToast({ title: e.message || '更新失败', icon: 'none' })
    }
  }

  const handleAccessoryCancel = () => {
    setShowAccessoryModal(false)
    setEditingItem(null)
    setSelectedAccessoryIds([])
  }

  // 计算选中商品的总价
  const selectedTotal = cartItems
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => {
      let price = Number(item.price) || 0
      if (item.accessories && item.accessories.length > 0) {
        price += item.accessories.reduce((a: number, acc: any) => a + Number(acc.price) || 0, 0)
      }
      return sum + price
    }, 0)

  const typeLabel: Record<string, string> = { doll: '娃娃', accessory: '配饰', outfit: '' }

  // 按拼单组分组
  const groupedCartItems = (() => {
    const normalItems: CartItem[] = []
    const groups: Record<string, CartGroup> = {}
    cartItems.forEach(item => {
      if (item.pindan_group_id) {
        if (!groups[item.pindan_group_id]) {
          groups[item.pindan_group_id] = {
            groupId: item.pindan_group_id,
            groupName: item.pindan_group_name || '拼单',
            items: [],
            totalQuantity: 0,
          }
        }
        groups[item.pindan_group_id].items.push(item)
        groups[item.pindan_group_id].totalQuantity += Number(item.quantity) || 0
      } else {
        normalItems.push(item)
      }
    })
    return { normalItems, groups: Object.values(groups) }
  })()

  if (!userInfo) {
    return (
      <View className="login-tip">
        <Text className="text-gray-500">请先登录后再查看购物车</Text>
      </View>
    )
  }

  return (
    <View className="page-cart">
      {loading ? (
        <View className="loading-tip"><Text className="text-gray-400">加载中...</Text></View>
      ) : (
        <>
          {cartItems.length === 0 ? (
            <View className="empty-cart">
              <Text className="empty-text">购物车是空的</Text>
              <Text className="empty-sub">快去挑选心仪的商品吧</Text>
            </View>
          ) : (
            <ScrollView scrollY className="cart-scroll">
              {/* 拼单组 */}
              {groupedCartItems.groups.map(group => (
                <View key={group.groupId} className="cart-group">
                  <View className="cart-group-header">
                    <View className="cart-group-tag">
                      <Text className="cart-group-tag-text">拼单</Text>
                    </View>
                    <Text className="cart-group-name">{group.groupName}</Text>
                    <Text className="cart-group-count">共{group.totalQuantity}件</Text>
                  </View>
                  {group.items.map(item => {
                    const isSelected = selectedIds.includes(item.id)
                    const itemTotal = Number((item.price || 0)) + Number((item.accessories || []).reduce((s: number, acc: any) => s + Number(acc.price || 0), 0))
                    return (
                      <View key={item.id} className={`cart-item ${isSelected ? 'selected' : ''}`}>
                        <View className="item-checkbox" onClick={() => toggleSelect(item.id)}>
                          <View className={`checkbox ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <Text className="check-icon">✓</Text>}
                          </View>
                        </View>
                        <Image
                          className="item-image"
                          src={item.coverImage || 'https://picsum.photos/100/100'}
                          mode="aspectFill"
                        />
                        <View className="item-content">
                          <Text className="item-name">{item.name}</Text>
                          <View className="item-tags">
                            {typeLabel[item.item_type] && <Text className="item-tag">{typeLabel[item.item_type]}</Text>}
                          </View>
                          {/* 搭配方案：显示默认配饰（默认配饰）+ 用户选择配饰（配饰） */}
                          {item.item_type === 'outfit' && item.defaultAccessories && item.defaultAccessories.length > 0 && (
                            <View className="item-accessories-row">
                              <Text className="item-accessories-label">默认配饰</Text>
                              <View className="item-accessories-content">
                                <Text className="item-accessories-text">
                                  {item.defaultAccessories.map((acc: any) => acc.name).join(' + ').slice(0, 15)}
                                  {item.defaultAccessories.map((acc: any) => acc.name).join(' + ').length > 15 ? '...' : ''}
                                </Text>
                              </View>
                            </View>
                          )}
                          <View className="item-accessories-row">
                            <Text className="item-accessories-label">配饰</Text>
                            <View className="item-accessories-content">
                              {item.accessories && item.accessories.length > 0 ? (
                                <Text
                                  className="item-accessories-text"
                                  onClick={() => handleEditAccessories(item)}
                                >
                                  {item.accessories.map((acc: any) => acc.name).join(' + ').slice(0, 15)}
                                  {item.accessories.map((acc: any) => acc.name).join(' + ').length > 15 ? '...' : ''}
                                  <Text className="edit-icon">✎</Text>
                                </Text>
                              ) : (
                                <Text
                                  className="item-accessories-add"
                                  onClick={() => handleEditAccessories(item)}
                                >
                                  选择配饰+
                                </Text>
                              )}
                            </View>
                          </View>
                          <View className="item-footer">
                            <Text className="item-price">¥{itemTotal.toFixed(2)}</Text>
                            <Text className="item-remove" onClick={() => handleRemove(item.id)}>删除</Text>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              ))}

              {/* 普通商品 */}
              {groupedCartItems.normalItems.length > 0 && (
                <View className="cart-normal">
                  <View className="cart-normal-header">
                    <Text className="cart-normal-title">普通商品</Text>
                    <Text className="cart-normal-count">共{groupedCartItems.normalItems.length}件</Text>
                  </View>
                  {groupedCartItems.normalItems.map(item => {
                    const isSelected = selectedIds.includes(item.id)
                    const itemTotal = Number((item.price || 0)) + Number((item.accessories || []).reduce((s: number, acc: any) => s + Number(acc.price || 0), 0))
                    return (
                      <View key={item.id} className={`cart-item ${isSelected ? 'selected' : ''}`}>
                        <View className="item-checkbox" onClick={() => toggleSelect(item.id)}>
                          <View className={`checkbox ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <Text className="check-icon">✓</Text>}
                          </View>
                        </View>
                        <Image
                          className="item-image"
                          src={item.coverImage || 'https://picsum.photos/100/100'}
                          mode="aspectFill"
                        />
                        <View className="item-content">
                          <Text className="item-name">{item.name}</Text>
                          <View className="item-tags">
                            {typeLabel[item.item_type] && <Text className="item-tag">{typeLabel[item.item_type]}</Text>}
                          </View>
                          {/* 搭配方案：显示默认配饰（默认配饰）+ 用户选择配饰（配饰） */}
                          {item.item_type === 'outfit' && item.defaultAccessories && item.defaultAccessories.length > 0 && (
                            <View className="item-accessories-row">
                              <Text className="item-accessories-label">默认配饰</Text>
                              <View className="item-accessories-content">
                                <Text className="item-accessories-text">
                                  {item.defaultAccessories.map((acc: any) => acc.name).join(' + ').slice(0, 15)}
                                  {item.defaultAccessories.map((acc: any) => acc.name).join(' + ').length > 15 ? '...' : ''}
                                </Text>
                              </View>
                            </View>
                          )}
                          <View className="item-accessories-row">
                            <Text className="item-accessories-label">配饰</Text>
                            <View className="item-accessories-content">
                              {item.accessories && item.accessories.length > 0 ? (
                                <Text
                                  className="item-accessories-text"
                                  onClick={() => handleEditAccessories(item)}
                                >
                                  {item.accessories.map((acc: any) => acc.name).join(' + ').slice(0, 15)}
                                  {item.accessories.map((acc: any) => acc.name).join(' + ').length > 15 ? '...' : ''}
                                  <Text className="edit-icon">✎</Text>
                                </Text>
                              ) : (
                                <Text
                                  className="item-accessories-add"
                                  onClick={() => handleEditAccessories(item)}
                                >
                                  选择配饰+
                                </Text>
                              )}
                            </View>
                          </View>
                          <View className="item-footer">
                            <Text className="item-price">¥{itemTotal.toFixed(2)}</Text>
                            <Text className="item-remove" onClick={() => handleRemove(item.id)}>删除</Text>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}

              <View className="clear-btn-wrap" onClick={handleClear}>
                <Text className="clear-btn">清空购物车</Text>
              </View>
            </ScrollView>
          )}

          {/* 底部操作栏 */}
          {cartItems.length > 0 && (
            <View className="bottom-bar">
              <View className="select-all" onClick={toggleSelectAll}>
                <View className={`checkbox ${selectedIds.length === cartItems.length ? 'checked' : ''}`}>
                  {selectedIds.length === cartItems.length && <Text className="check-icon">✓</Text>}
                </View>
                <Text className="select-all-text">全选</Text>
              </View>
              <View className="total-section">
                <Text className="total-label">合计：</Text>
                <Text className="total-price">¥{selectedTotal.toFixed(2)}</Text>
              </View>
              <View className="submit-btn" onClick={handleSubmit}>
                <Text className="submit-text">提交询价</Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* 配饰选择弹窗 */}
      {showAccessoryModal && (
        <View className="accessory-modal">
          <View className="accessory-modal-mask" onClick={handleAccessoryCancel} />
          <View className="accessory-modal-content">
            <View className="modal-header">
              <Text className="modal-title">选择配饰</Text>
              <View className="modal-close" onClick={handleAccessoryCancel}>✕</View>
            </View>
            <ScrollView scrollY className="modal-body">
              {allAccessories.length === 0 ? (
                <View className="modal-empty"><Text className="text-gray-400">暂无可选配饰</Text></View>
              ) : (
                <View className="accessory-list">
                  {allAccessories.map(acc => (
                    <View
                      key={acc.id}
                      className={`accessory-option ${selectedAccessoryIds.includes(acc.id) ? 'selected' : ''}`}
                      onClick={() => {
                        if (selectedAccessoryIds.includes(acc.id)) {
                          setSelectedAccessoryIds(prev => prev.filter(id => id !== acc.id))
                        } else {
                          setSelectedAccessoryIds(prev => [...prev, acc.id])
                        }
                      }}
                    >
                      <View className={`option-checkbox ${selectedAccessoryIds.includes(acc.id) ? 'checked' : ''}`}>
                        {selectedAccessoryIds.includes(acc.id) && <Text className="check-icon">✓</Text>}
                      </View>
                      <Image
                        className="option-image"
                        src={acc.images?.[0] || 'https://picsum.photos/60/60'}
                        mode="aspectFill"
                      />
                      <View className="option-info">
                        <Text className="option-name">{acc.name}</Text>
                        <Text className="option-price">¥{acc.price}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            <View className="modal-footer">
              <View className="modal-btn cancel" onClick={handleAccessoryCancel}>取消</View>
              <View className="modal-btn confirm" onClick={handleAccessoryConfirm}>确定</View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
