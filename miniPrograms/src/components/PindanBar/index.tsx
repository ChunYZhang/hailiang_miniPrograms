import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { showToast } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

interface PindanGroup {
  groupId: string
  groupName: string
  items: any[]
  totalQuantity: number
  boxSize?: 'small' | 'medium' | 'large'
}

export default function PindanBar() {
  const { isPindanMode, pindanItems, exitPindanMode, removeFromPindan, clearPindan, setCartCount, userInfo, updatePindanItemQuantity } = useGlobalState()
  const [expanded, setExpanded] = useState(false)
  const [groupedItems, setGroupedItems] = useState<PindanGroup[]>([])

  useEffect(() => {
    if (isPindanMode) {
      setExpanded(true)
    }
  }, [isPindanMode])

  useEffect(() => {
    const groups: Record<string, any[]> = {}
    pindanItems.forEach(item => {
      const groupId = item.pindanGroupId || 'default'
      if (!groups[groupId]) {
        groups[groupId] = []
      }
      groups[groupId].push(item)
    })
    const groupsList: PindanGroup[] = Object.entries(groups).map(([groupId, items]) => ({
      groupId,
      groupName: items[0]?.pindanGroupName || '拼单',
      items,
      totalQuantity: items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
      boxSize: items[0]?.boxSize,
    }))
    setGroupedItems(groupsList)
  }, [pindanItems])

  if (!isPindanMode || pindanItems.length === 0) return null

  const firstItem = pindanItems[0]
  const boxSize = firstItem?.boxSize || 'small'
  const boxSizeLabel = boxSize === 'small' ? '小箱' : boxSize === 'medium' ? '中箱' : boxSize === 'large' ? '大箱' : '小箱'
  // 根据箱子尺寸获取容量
  const getBoxCapacity = () => {
    if (!firstItem) return 0
    if (boxSize === 'small') return firstItem.smallBoxCapacity || 0
    if (boxSize === 'medium') return firstItem.mediumBoxCapacity || 0
    if (boxSize === 'large') return firstItem.largeBoxCapacity || 0
    return 0
  }
  const totalQuantityAll = pindanItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
  const boxCapacity = getBoxCapacity()
  const remainingCapacity = boxCapacity - totalQuantityAll
  const allMinQuantity = pindanItems.every(item => (Number(item.quantity) || 0) >= (Number(item.minQuantity) || 0))
  const canCompletePindan = pindanItems.length > 0 && allMinQuantity && remainingCapacity >= 0

  console.log('[PindanBar] DEBUG:', JSON.stringify(pindanItems.map(i => ({
    name: i.name,
    quantity: i.quantity,
    minQuantity: i.minQuantity,
    qtyNum: Number(i.quantity),
    minNum: Number(i.minQuantity),
    pass: (Number(i.quantity) || 0) >= (Number(i.minQuantity) || 0)
  }))))
  console.log('[PindanBar] totalQuantityAll:', totalQuantityAll, 'boxCapacity:', boxCapacity, 'remainingCapacity:', remainingCapacity)
  console.log('[PindanBar] allMinQuantity:', allMinQuantity, 'canCompletePindan:', canCompletePindan)

  const handleRemoveItem = (itemId: string) => {
    removeFromPindan(itemId)
    if (pindanItems.length <= 1) {
      exitPindanMode()
    }
  }

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = pindanItems.find(i => i.itemId === itemId)
    if (!item) return
    const newQty = (Number(item.quantity) || 0) + delta
    if (newQty < 1) return
    // 检查是否超过箱子容量
    const otherTotal = pindanItems.filter(i => i.itemId !== itemId).reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    if (newQty + otherTotal > boxCapacity) {
      showToast({ title: `箱子最多装${boxCapacity}个`, icon: 'none' })
      return
    }
    updatePindanItemQuantity(itemId, newQty)
  }

  const handleSavePindan = async () => {
    if (!canCompletePindan) {
      const totalShortage = pindanItems.reduce((sum, item) => {
        if ((Number(item.quantity) || 0) < (Number(item.minQuantity) || 0)) {
          return sum + ((Number(item.minQuantity) || 0) - (Number(item.quantity) || 0))
        }
        return sum
      }, 0)
      showToast({ title: `未达起购数量，还差${totalShortage}个`, icon: 'none' })
      return
    }
    if (remainingCapacity < 0) {
      showToast({ title: '超出箱子容量', icon: 'none' })
      return
    }
    if (!userInfo) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    try {
      for (const item of pindanItems) {
        await api.cart.add({
          item_type: item.itemType,
          item_id: item.itemId,
          accessories: item.accessories,
          quantity: item.quantity,
          pindan_group_id: item.pindanGroupId,
          pindan_group_name: item.pindanGroupName,
          box_size: item.boxSize,
        })
      }
      showToast({ title: '已加入购物车', icon: 'success' })
      const res = await api.cart.list()
      setCartCount(res.data?.length || 0)
      clearPindan()
    } catch (e: any) {
      showToast({ title: e.message || '添加失败', icon: 'none' })
    }
  }

  const handleCancelPindan = () => {
    clearPindan()
    showToast({ title: '已取消拼单', icon: 'none' })
  }

  return (
    <>
      {/* 右侧悬浮卡片 */}
      <View className="pindan-float" onClick={() => setExpanded(!expanded)}>
        {pindanItems.length > 0 && (
          <View className="pindan-float-indicator">{pindanItems.length}</View>
        )}
        <Text className="pindan-float-count">{pindanItems.length}</Text>
        <Text className="pindan-float-text">拼单</Text>
      </View>

      {/* 底部展开面板 */}
      <View className="pindan-bar">
        <View className="pindan-bar-header" onClick={() => setExpanded(!expanded)}>
          <View className="pindan-bar-left">
            <Text className="pindan-badge">{pindanItems.length}</Text>
            <Text className="pindan-title">拼单中 {boxSizeLabel}</Text>
            <Text className="pindan-count">{allMinQuantity ? '✓已达标' : '待凑单'}</Text>
          </View>
          <View className="pindan-bar-right">
            <Text className="expand-icon">{expanded ? '▼' : '▲'}</Text>
          </View>
        </View>

        {expanded && (
          <>
            {/* 拼单容量提示 */}
            <View className="pindan-tip-bar">
              <Text className="pindan-bar-tip-text">
                {boxSizeLabel} 可装约{boxCapacity}个娃娃{remainingCapacity > 0 ? `，还差${remainingCapacity}个` : '（已满）'}
              </Text>
            </View>
            <ScrollView scrollX className="pindan-bar-content">
              {groupedItems.map(group => (
                <View key={group.groupId} className="pindan-group">
                  <View className="pindan-group-header">
                    <Text className="pindan-group-name">{group.groupName}</Text>
                    <Text className="pindan-group-count">共{group.totalQuantity}个</Text>
                  </View>
                  {group.items.map(item => (
                    <View key={item.itemId} className="pindan-item">
                      <Image
                        className="pindan-item-image"
                        src={item.coverImage || 'https://picsum.photos/60/60'}
                        mode="aspectFill"
                      />
                      <View className="pindan-item-info">
                        <Text className="pindan-item-name">{item.name}</Text>
                        <Text className="pindan-item-price">¥{(((Number(item.price) || 0) + (Number(item.accessoriesPrice) || 0)) * item.quantity).toFixed(2)}</Text>
                      </View>
                      <View className="pindan-item-quantity">
                        <View className="qty-adjust">
                          <Text className="qty-btn" onClick={() => handleQuantityChange(item.itemId, -10)}>-10</Text>
                          <Text className="qty-btn" onClick={() => handleQuantityChange(item.itemId, -1)}>-1</Text>
                        </View>
                        <Text className="qty-label">{item.quantity}个</Text>
                        <View className="qty-adjust">
                          <Text className="qty-btn" onClick={() => handleQuantityChange(item.itemId, 1)}>+1</Text>
                          <Text className="qty-btn" onClick={() => handleQuantityChange(item.itemId, 10)}>+10</Text>
                        </View>
                      </View>
                      <View className="pindan-item-remove" onClick={() => handleRemoveItem(item.itemId)}>
                        <Text className="remove-icon">×</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        <View className="pindan-bar-footer">
          <View className="btn-cancel" onClick={handleCancelPindan}>取消拼单</View>
          <View
            className={`btn-save ${canCompletePindan ? '' : 'disabled'}`}
            onClick={handleSavePindan}
          >
            <Text className="btn-save-text">
              {canCompletePindan ? '完成拼单' : '未达起购量'}
            </Text>
          </View>
        </View>
      </View>
    </>
  )
}
