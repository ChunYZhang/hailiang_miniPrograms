import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import Taro, { showToast, showModal, useDidShow, navigateTo } from '@tarojs/taro'
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
  quantity: number
  minQuantity?: number
  smallBoxCapacity?: number
  mediumBoxCapacity?: number
  largeBoxCapacity?: number
  boxSize?: string
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
  const { companyName } = useGlobalState()

  useDidShow(() => {
    if (companyName) {
      Taro.setNavigationBarTitle({ title: companyName })
    }
  })
  const { userInfo, setCartCount } = useGlobalState()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 配饰编辑弹窗状态
  const [showAccessoryModal, setShowAccessoryModal] = useState(false)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [allAccessories, setAllAccessories] = useState<Accessory[]>([])
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([])
  // 数量编辑弹窗状态
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [editingQuantityItem, setEditingQuantityItem] = useState<CartItem | null>(null)
  const [editQuantity, setEditQuantity] = useState(1)

  // 每次页面显示时刷新购物车数据
  useDidShow(() => {
    if (userInfo) loadCart()
  })

  const loadCart = async () => {
    if (!userInfo) return
    setLoading(true)
    try {
      const res = await api.cart.list()
      console.log('[CART] 返回数据:', JSON.stringify(res.data, null, 2))
      setCartItems(res.data || [])
      setSelectedIds((res.data || []).map((item: any) => item.id))
    } catch (e) {
      console.error('加载购物车失败', e)
    } finally {
      setLoading(false)
    }
  }

  const loadAllAccessories = async (itemType: string, itemId: string) => {
    try {
      if (itemType === 'doll') {
        // 娃娃：优先加载搭配方案配饰，如果没有则加载全部
        const outfitRes = await api.doll.outfitAccessories(itemId)
        if (outfitRes.data && outfitRes.data.length > 0) {
          setAllAccessories(outfitRes.data)
        } else {
          const res = await api.accessory.list({ page_size: 100 })
          setAllAccessories(res.data || [])
        }
      } else {
        const res = await api.accessory.list({ page_size: 100 })
        setAllAccessories(res.data || [])
      }
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

    // 校验拼单组：检查起购数量和生成备注
    const pindanGroups: Record<string, typeof cartItems> = {}
    selectedItems.forEach(item => {
      if (item.pindan_group_id) {
        if (!pindanGroups[item.pindan_group_id]) {
          pindanGroups[item.pindan_group_id] = []
        }
        pindanGroups[item.pindan_group_id].push(item)
      }
    })

    let autoRemark = ''
    for (const [groupId, groupItems] of Object.entries(pindanGroups)) {
      const boxSize = groupItems[0]?.boxSize || 'small'
      let boxCapacity = 0
      if (boxSize === 'small') boxCapacity = groupItems[0]?.smallBoxCapacity || 0
      else if (boxSize === 'medium') boxCapacity = groupItems[0]?.mediumBoxCapacity || 0
      else boxCapacity = groupItems[0]?.largeBoxCapacity || 0

      const totalQty = groupItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

      // 检查每个商品的起购量
      for (const item of groupItems) {
        if (item.minQuantity && (Number(item.quantity) || 0) < item.minQuantity) {
          showToast({ title: `${item.name}未达起购量${item.minQuantity}个`, icon: 'none' })
          return
        }
      }

      // 检查是否装满箱子
      if (totalQty < boxCapacity) {
        showToast({ title: `拼单还差${boxCapacity - totalQty}个未装满`, icon: 'none' })
        return
      }

      // 超出容量时生成备注
      if (totalQty > boxCapacity) {
        autoRemark += `${groupItems[0]?.name || '拼单'}超出${totalQty - boxCapacity}个；`
      }
    }

    // 如果有超出的备注，让用户确认并补充
    if (autoRemark) {
      Taro.showModal({
        title: '拼单超出容量提示',
        content: autoRemark + '\n\n请在备注中说明情况',
        confirmText: '继续提交',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 合并到备注
            const baseRemark = wx.getStorageSync('checkout_remark') || ''
            const finalRemark = baseRemark + (baseRemark ? '\n' : '') + autoRemark
            wx.setStorageSync('checkout_selected_ids', JSON.stringify(selectedIds))
            wx.setStorageSync('checkout_remark', finalRemark)
            navigateTo({ url: '/pages/order-confirm/index' })
          }
        }
      })
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
    await loadAllAccessories(item.item_type, item.item_id)
    setShowAccessoryModal(true)
  }

  const handleAccessoryConfirm = async () => {
    if (!editingItem) return
    try {
      const selectedAccessories = allAccessories
        .filter(acc => selectedAccessoryIds.includes(acc.id))
        .map(acc => ({ id: acc.id, name: acc.name, price: acc.price }))

      // 先删除旧记录，等完成后添加新记录
      await api.cart.remove(editingItem.id)
      // 添加新记录，保留原有的 quantity 和 box_size
      await api.cart.add({
        item_type: editingItem.item_type,
        item_id: editingItem.item_id,
        accessories: selectedAccessories,
        quantity: editingItem.quantity,
        box_size: editingItem.boxSize,
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

  // 打开数量编辑弹窗
  const handleEditQuantity = (item: CartItem) => {
    setEditingQuantityItem(item)
    setEditQuantity(Number(item.quantity) || 1)
    setShowQuantityModal(true)
  }

  const handleQuantityConfirm = async () => {
    if (!editingQuantityItem) return
    if (editQuantity < 1) {
      showToast({ title: '数量不能少于1', icon: 'none' })
      return
    }
    // 起购数量校验：仅拼单商品需要校验（拼单 quantity 是个数）
    // 普通商品 quantity 是箱子个数，按箱购买没有起购限制
    if (editingQuantityItem.pindan_group_id && editingQuantityItem.minQuantity && editQuantity < editingQuantityItem.minQuantity) {
      showToast({ title: `起购数量${editingQuantityItem.minQuantity}个`, icon: 'none' })
      return
    }
    try {
      await api.cart.update(editingQuantityItem.id, { quantity: editQuantity })
      showToast({ title: '已更新', icon: 'success' })
      setShowQuantityModal(false)
      setEditingQuantityItem(null)
      loadCart()
    } catch (e: any) {
      showToast({ title: e.message || '更新失败', icon: 'none' })
    }
  }

  const handleQuantityCancel = () => {
    setShowQuantityModal(false)
    setEditingQuantityItem(null)
    setEditQuantity(1)
  }

  // 计算选中商品的总价
  // 非拼单：price已经是(娃娃+配饰)*箱子容量*箱子个数，直接用price
  // 拼单：price已含(娃娃+配饰)，直接price*quantity
  const selectedTotal = cartItems
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => {
      if (item.pindan_group_id) {
        // 拼单：price已含(娃娃+配饰)，quantity是个数
        return sum + Number(item.price || 0) * (Number(item.quantity) || 1)
      } else {
        // 非拼单：price已含(娃娃+配饰)*箱子容量*箱子个数，直接用price
        return sum + Number(item.price || 0)
      }
    }, 0)

  const typeLabel: Record<string, string> = { doll: '', accessory: '配饰', outfit: '' }

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
                    {group.items[0]?.boxSize && (() => {
                      const bs = group.items[0].boxSize
                      const cap = bs === 'small' ? (group.items[0].smallBoxCapacity || 0) : bs === 'medium' ? (group.items[0].mediumBoxCapacity || 0) : (group.items[0].largeBoxCapacity || 0)
                      const capLabel = bs === 'small' ? '小箱' : bs === 'medium' ? '中箱' : '大箱'
                      return <Text className="cart-group-count">{capLabel}(约{cap}个) 共{group.totalQuantity}件</Text>
                    })()}
                  </View>
                  {group.items.map(item => {
                    const isSelected = selectedIds.includes(item.id)
                    // 拼单：price已经是娃娃单价+配饰总价（更新配饰后price会重新计算），直接price*quantity
                    // 不再额外加accessories，因为price已经包含了
                    const itemTotal = item.pindan_group_id
                      ? Number(item.price || 0) * (Number(item.quantity) || 1)
                      : Number(item.price || 0)  // 非拼单price已含(娃娃+配饰)*箱子容量*箱数
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
                            {item.item_type === 'outfit' && item.defaultAccessories && item.defaultAccessories.length > 0 && (
                              <Text className="item-tag">默认配饰</Text>
                            )}
                          </View>
                          {/* 搭配方案：显示默认配饰 + 用户选择配饰 */}
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
                          {/* 娃娃类型：显示默认配饰文本 */}
                          {item.item_type === 'doll' && item.defaultAccessory && (
                            <View className="item-accessories-row">
                              <Text className="item-accessories-label">默认配饰</Text>
                              <View className="item-accessories-content">
                                <Text className="item-accessories-text">
                                  {item.defaultAccessory}
                                </Text>
                              </View>
                            </View>
                          )}
                          <View className="item-accessories-row">
                            <Text className="item-accessories-label">搭配配饰</Text>
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
                          <View className="item-quantity-row">
                            <Text className="item-quantity-label">数量</Text>
                            <View className="item-quantity-edit" onClick={() => handleEditQuantity(item)}>
                              {item.pindan_group_id ? (
                                <Text className="item-quantity-text">{item.quantity}个</Text>
                              ) : (
                                (() => {
                                  const bs = item.boxSize || 'small'
                                  const cap = bs === 'small' ? (item.smallBoxCapacity || 0) : bs === 'medium' ? (item.mediumBoxCapacity || 0) : (item.largeBoxCapacity || 0)
                                  const bsLabel = bs === 'small' ? '小箱' : bs === 'medium' ? '中箱' : '大箱'
                                  return <Text className="item-quantity-text">{item.quantity}个 {bsLabel}(约{cap}个)</Text>
                                })()
                              )}
                              <Text className="edit-icon">✎</Text>
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
                    // 拼单：price已含(娃娃+配饰)，直接price*quantity
                    const itemTotal = item.pindan_group_id
                      ? Number(item.price || 0) * (Number(item.quantity) || 1)
                      : Number(item.price || 0)  // 非拼单price已含(娃娃+配饰)*箱子容量*箱数
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
                            {item.item_type === 'outfit' && item.defaultAccessories && item.defaultAccessories.length > 0 && (
                              <Text className="item-tag">默认配饰</Text>
                            )}
                          </View>
                          {/* 搭配方案：显示默认配饰 + 用户选择配饰 */}
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
                          {/* 娃娃类型：显示默认配饰文本 */}
                          {item.item_type === 'doll' && item.defaultAccessory && (
                            <View className="item-accessories-row">
                              <Text className="item-accessories-label">默认配饰</Text>
                              <View className="item-accessories-content">
                                <Text className="item-accessories-text">
                                  {item.defaultAccessory}
                                </Text>
                              </View>
                            </View>
                          )}
                          <View className="item-accessories-row">
                            <Text className="item-accessories-label">搭配配饰</Text>
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
                          <View className="item-quantity-row">
                            <Text className="item-quantity-label">数量</Text>
                            <View className="item-quantity-edit" onClick={() => handleEditQuantity(item)}>
                              {item.pindan_group_id ? (
                                <Text className="item-quantity-text">{item.quantity}个</Text>
                              ) : (
                                (() => {
                                  const bs = item.boxSize || 'small'
                                  const cap = bs === 'small' ? (item.smallBoxCapacity || 0) : bs === 'medium' ? (item.mediumBoxCapacity || 0) : (item.largeBoxCapacity || 0)
                                  const bsLabel = bs === 'small' ? '小箱' : bs === 'medium' ? '中箱' : '大箱'
                                  return <Text className="item-quantity-text">{item.quantity}个 {bsLabel}(约{cap}个)</Text>
                                })()
                              )}
                              <Text className="edit-icon">✎</Text>
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

      {/* 数量编辑弹窗 */}
      {showQuantityModal && (
        <View className="accessory-modal">
          <View className="accessory-modal-mask" onClick={handleQuantityCancel} />
          <View className="accessory-modal-content">
            <View className="modal-header">
              <Text className="modal-title">修改数量</Text>
              <View className="modal-close" onClick={handleQuantityCancel}>✕</View>
            </View>
            <View className="modal-body">
              <View className="quantity-edit-wrap">
                <View className="quantity-edit-item">
                  <Text className="quantity-edit-name">{editingQuantityItem?.name}</Text>
                  <View className="quantity-selector">
                    <View
                      className={`quantity-btn ${editQuantity <= 1 ? 'disabled' : ''}`}
                      onClick={() => setEditQuantity(q => Math.max(1, q - 1))}
                    >
                      <Text className="quantity-btn-text">-</Text>
                    </View>
                    <Input
                      className="quantity-input"
                      type="number"
                      value={String(editQuantity)}
                      onInput={(e: any) => {
                        const val = e.detail.value
                        if (val === '') {
                          setEditQuantity(0)
                        } else {
                          setEditQuantity(parseInt(val) || 0)
                        }
                      }}
                      onBlur={(e: any) => {
                        const val = e.detail.value
                        const num = parseInt(val) || 1
                        setEditQuantity(Math.max(1, num))
                      }}
                    />
                    <View
                      className="quantity-btn"
                      onClick={() => setEditQuantity(q => q + 1)}
                    >
                      <Text className="quantity-btn-text">+</Text>
                    </View>
                  </View>
                  {editingQuantityItem && editingQuantityItem.pindan_group_id && editingQuantityItem.minQuantity && editQuantity < editingQuantityItem.minQuantity && (
                    <Text className="quantity-tip">起购量{editingQuantityItem.minQuantity}个</Text>
                  )}
                </View>
              </View>
            </View>
            <View className="modal-footer">
              <View className="modal-btn cancel" onClick={handleQuantityCancel}>取消</View>
              <View className="modal-btn confirm" onClick={handleQuantityConfirm}>确定</View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
