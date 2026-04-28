import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { showToast, showModal, switchTab } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

interface Accessory {
  id: string
  name: string
  price: number
  images?: string[]
}

interface Props {
  item: any
  itemType: 'doll' | 'accessory' | 'outfit'
  show: boolean
  onClose: () => void
}

export default function CartModal({ item, itemType, show, onClose }: Props) {
  const { userInfo, setCartCount, addToPindan, enterPindanMode, isPindanMode, pindanItems, createPindanGroup } = useGlobalState()
  const [quantity, setQuantity] = useState(1)
  const [allAccessories, setAllAccessories] = useState<Accessory[]>([])
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([])
  const [showAccessoryModal, setShowAccessoryModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(false)

  // 监听拼单模式状态，状态更新后跳转
  useEffect(() => {
    if (pendingNav && isPindanMode) {
      setPendingNav(false)
      switchTab({ url: '/pages/doll-list/index' })
    }
  }, [pendingNav, isPindanMode])

  const minQuantity = item.min_quantity || 1
  const basePrice = itemType === 'outfit' ? item.total_price : item.price
  const accessoriesPrice = allAccessories
    .filter(acc => selectedAccessoryIds.includes(acc.id))
    .reduce((sum, acc) => sum + (Number(acc.price) || 0), 0)
  const totalPrice = (Number(basePrice) + accessoriesPrice) * quantity
  const coverImage = itemType === 'outfit' ? item.cover_image : (item.images?.[0] || item.image)
  const defaultAccessories = item.accessories || []

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta
    if (newQty < 1) return
    if (delta > 0 && newQty > 0 && newQty < minQuantity) {
      showToast({ title: `起购${minQuantity}个，可发起拼单凑齐`, icon: 'none' })
    }
    setQuantity(newQty)
  }

  const loadAllAccessories = async () => {
    try {
      const res = await api.accessory.list({ page_size: 100 })
      setAllAccessories(res.data || [])
    } catch (e) {
      console.error('加载配饰失败', e)
    }
  }

  const handleOpenAccessoryModal = async () => {
    await loadAllAccessories()
    setShowAccessoryModal(true)
  }

  const handleAccessoryConfirm = () => {
    setShowAccessoryModal(false)
  }

  const handleAccessoryCancel = () => {
    setSelectedAccessoryIds([])
    setShowAccessoryModal(false)
  }

  // 直接添加到拼单池（拼单模式下使用）
  const handleAddDirectToPindan = async () => {
    if (!userInfo) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (quantity < minQuantity) {
      showToast({ title: `起购${minQuantity}个`, icon: 'none' })
      return
    }
    const selectedAccessories = allAccessories
      .filter(acc => selectedAccessoryIds.includes(acc.id))
      .map(acc => ({ id: acc.id, name: acc.name, price: acc.price }))

    // 获取拼单组信息：如果已有拼单商品则沿用，否则创建新组
    const firstItem = pindanItems[0]
    const { groupId, groupName } = firstItem?.pindanGroupId ? { groupId: firstItem.pindanGroupId, groupName: firstItem.pindanGroupName } : createPindanGroup(userInfo?.nickname)
    const poolBoxSize = firstItem?.boxSize || 'small'

    addToPindan({
      id: Date.now().toString(),
      itemType,
      itemId: item.id,
      name: item.name,
      price: Number(basePrice) || 0,
      accessoriesPrice: Number(accessoriesPrice) || 0,
      coverImage: coverImage || '',
      quantity,
      accessories: selectedAccessories,
      minQuantity,
      pindanGroupId: groupId,
      pindanGroupName: groupName,
      boxSize: poolBoxSize,
      smallBoxCapacity: firstItem?.smallBoxCapacity || 0,
      mediumBoxCapacity: firstItem?.mediumBoxCapacity || 0,
      largeBoxCapacity: firstItem?.largeBoxCapacity || 0,
    })
    showToast({ title: '已添加到拼单池', icon: 'success' })
    onClose()
    setTimeout(() => {
      switchTab({ url: '/pages/doll-list/index' })
    }, 1000)
  }

  // 保存到购物车（非拼单模式）
  const handleAddToCart = async () => {
    if (!userInfo) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (quantity < minQuantity) {
      showModal({
        title: '起购量不足',
        content: `该商品最低起购${minQuantity}个，当前${quantity}个。您可以发起拼单凑齐起购量，或继续加购更多商品。`,
        confirmText: '发起拼单',
        cancelText: '继续加购',
        success: (res) => {
          if (res.confirm) {
            handleStartPindan()
          }
        }
      })
      return
    }
    try {
      const selectedAccessories = allAccessories
        .filter(acc => selectedAccessoryIds.includes(acc.id))
        .map(acc => ({ id: acc.id, name: acc.name, price: acc.price }))

      await api.cart.add({
        item_type: itemType,
        item_id: item.id,
        accessories: selectedAccessories,
        quantity,
      })
      showToast({ title: '已加入购物车', icon: 'success' })
      const res = await api.cart.list()
      setCartCount(res.data?.length || 0)
      onClose()
    } catch (e: any) {
      showToast({ title: e.message || '添加失败', icon: 'none' })
    }
  }

  // 发起拼单
  const handleStartPindan = () => {
    if (!userInfo) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const selectedAccessories = allAccessories
      .filter(acc => selectedAccessoryIds.includes(acc.id))
      .map(acc => ({ id: acc.id, name: acc.name, price: acc.price }))

    const { groupId, groupName } = createPindanGroup(userInfo?.nickname)
    // 获取箱子尺寸和容量（如果有的话）
    const boxSize = item.boxSize || 'small'
    const smallBoxCapacity = item.small_box_capacity || item.smallBoxCapacity || 0
    const mediumBoxCapacity = item.medium_box_capacity || item.mediumBoxCapacity || 0
    const largeBoxCapacity = item.large_box_capacity || item.largeBoxCapacity || 0

    addToPindan({
      id: Date.now().toString(),
      itemType,
      itemId: item.id,
      name: item.name,
      price: Number(basePrice) || 0,
      accessoriesPrice: Number(accessoriesPrice) || 0,
      coverImage: coverImage || '',
      quantity,
      accessories: selectedAccessories,
      minQuantity,
      pindanGroupId: groupId,
      pindanGroupName: groupName,
      boxSize,
      smallBoxCapacity,
      mediumBoxCapacity,
      largeBoxCapacity,
    })
    enterPindanMode()
    onClose()
    showToast({ title: '已进入拼单模式，请继续添加商品', icon: 'none' })
    setPendingNav(true)
  }

  if (!show) return null

  return (
    <View className="cart-modal">
      <View className="mask" onClick={onClose} />
      <View className="content">
        <View className="header">
          <Text className="title">{isPindanMode ? '添加到拼单池' : '添加到购物车'}</Text>
          <View className="close" onClick={onClose}>✕</View>
        </View>

        <ScrollView scrollY className="body">
          {/* 商品信息 */}
          <View className="goods-info">
            <Image
              className="goods-image"
              src={coverImage || 'https://picsum.photos/100/100'}
              mode="aspectFill"
            />
            <View className="goods-detail">
              <Text className="goods-name">{item.name}</Text>
              <Text className="goods-price">¥{(Number(totalPrice) || 0).toFixed(2)}</Text>
              {accessoriesPrice > 0 && (
                <Text className="accessories-price">含配饰¥{accessoriesPrice} x {quantity}</Text>
              )}
            </View>
          </View>

          {/* 数量选择 */}
          <View className="section">
            <View className="section-title">数量</View>
            <View className="quantity-row">
              <View className="quantity-btn minus" onClick={() => handleQuantityChange(-1)}>−</View>
              <Text className="quantity-value">{quantity}</Text>
              <View className="quantity-btn plus" onClick={() => handleQuantityChange(1)}>+</View>
              {minQuantity > 1 && (
                <Text className="min-tip">（{minQuantity}个起购）</Text>
              )}
            </View>
          </View>

          {/* 配饰选择（仅搭配方案显示默认配饰） */}
          {itemType === 'outfit' && defaultAccessories.length > 0 && (
            <View className="section">
              <View className="section-title">默认配饰</View>
              <Text className="accessories-text">
                {defaultAccessories.map((acc: any) => acc.name).join(' + ')}
              </Text>
            </View>
          )}
        </ScrollView>

        <View className="footer">
          <View className="btn cancel" onClick={onClose}>取消</View>
          {isPindanMode ? (
            // 拼单模式下只显示保存按钮
            <View className="btn save" onClick={handleAddDirectToPindan}>保存</View>
          ) : (
            // 非拼单模式显示拼单和保存按钮
            <>
              <View className="btn-pindan" onClick={handleStartPindan}>拼单</View>
              <View className="btn save" onClick={handleAddToCart}>保存</View>
            </>
          )}
        </View>
      </View>

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
