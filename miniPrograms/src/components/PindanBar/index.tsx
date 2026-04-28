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
}

export default function PindanBar() {
  const { isPindanMode, pindanItems, exitPindanMode, removeFromPindan, clearPindan, setCartCount, userInfo } = useGlobalState()
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
    }))
    setGroupedItems(groupsList)
  }, [pindanItems])

  if (!isPindanMode || pindanItems.length === 0) return null

  const allMinQuantity = pindanItems.every(item => (Number(item.quantity) || 0) >= (Number(item.minQuantity) || 0))

  const handleRemoveItem = (itemId: string) => {
    removeFromPindan(itemId)
    if (pindanItems.length <= 1) {
      exitPindanMode()
    }
  }

  const handleSavePindan = async () => {
    console.log('handleSavePindan called, pindanItems:', pindanItems.length)
    showToast({ title: '开始保存拼单', icon: 'none' })
    if (!userInfo) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!allMinQuantity) {
      showToast({ title: '部分商品未达到起购数量', icon: 'none' })
      return
    }
    try {
      console.log('pindanItems to save:', JSON.stringify(pindanItems))
      for (const item of pindanItems) {
        console.log('saving item with pindanGroupId:', item.pindanGroupId, 'pindanGroupName:', item.pindanGroupName)
        await api.cart.add({
          item_type: item.itemType,
          item_id: item.itemId,
          accessories: item.accessories,
          quantity: item.quantity,
          pindan_group_id: item.pindanGroupId,
          pindan_group_name: item.pindanGroupName,
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

  const totalQuantityAll = pindanItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0)

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
            <Text className="pindan-title">拼单中</Text>
            <Text className="pindan-count">共{totalQuantityAll}件</Text>
          </View>
          <View className="pindan-bar-right">
            <Text className="expand-icon">{expanded ? '▼' : '▲'}</Text>
          </View>
        </View>

        {expanded && (
          <ScrollView scrollX className="pindan-bar-content">
            {groupedItems.map(group => (
              <View key={group.groupId} className="pindan-group">
                <View className="pindan-group-header">
                  <Text className="pindan-group-name">{group.groupName}</Text>
                  <Text className="pindan-group-count">共{group.totalQuantity}件</Text>
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
                      <Text className="pindan-item-price">¥{(Number(item.price) || 0).toFixed(2)}</Text>
                    </View>
                    <View className="pindan-item-quantity">
                      <Text className="qty-label">x{item.quantity}</Text>
                      {(Number(item.quantity) || 0) < (Number(item.minQuantity) || 0) && (
                        <Text className="qty-tip">差{(Number(item.minQuantity) || 0) - (Number(item.quantity) || 0)}</Text>
                      )}
                    </View>
                    <View className="pindan-item-remove" onClick={() => handleRemoveItem(item.itemId)}>
                      <Text className="remove-icon">×</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        <View className="pindan-bar-footer">
          <View className="btn-cancel" onClick={handleCancelPindan}>取消拼单</View>
          <View
            className={`btn-save ${allMinQuantity ? '' : 'disabled'}`}
            onClick={handleSavePindan}
          >
            <Text className="btn-save-text">
              {allMinQuantity ? '保存拼单' : `还差${pindanItems.filter(i => (Number(i.quantity) || 0) < (Number(i.minQuantity) || 0)).reduce((s, i) => s + ((Number(i.minQuantity) || 0) - (Number(i.quantity) || 0)), 0)}件`}
            </Text>
          </View>
        </View>
      </View>
    </>
  )
}
