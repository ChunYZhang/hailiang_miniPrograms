import { useState, useEffect } from 'react'
import { View, Text, Image, Input, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { navigateTo } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

export default function DollListPage() {
  const { isPindanMode, pindanItems, exitPindanMode, clearPindan, removeFromPindan, updatePindanItemQuantity } = useGlobalState()
  const [dolls, setDolls] = useState<any[]>([])
  const [seriesList, setSeriesList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [selectedSeries, setSelectedSeries] = useState('')
  const [showSeriesModal, setShowSeriesModal] = useState(false)
  const [showPindanPool, setShowPindanPool] = useState(false)

  const loadSeries = async () => {
    try {
      const res = await api.series.list()
      setSeriesList(res.data || [])
    } catch (e) {
      console.error('加载系列失败', e)
    }
  }

  const loadDolls = async () => {
    setLoading(true)
    try {
      const res = await api.doll.list({ series: selectedSeries || undefined, keyword: keyword || undefined, page_size: 100 })
      let data = res.data || []

      if (keyword) {
        const kw = keyword.toLowerCase()
        data = data.filter((d: any) => {
          const matchName = d.name?.toLowerCase().includes(kw)
          const matchSeries = d.series?.toLowerCase().includes(kw)
          const matchAccessory = d.defaultAccessory?.toLowerCase().includes(kw)
          return matchName || matchSeries || matchAccessory
        })
      }

      setDolls(data)
    } catch (e) {
      console.error('加载娃娃列表失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSeries()
  }, [])

  useEffect(() => {
    loadDolls()
  }, [keyword, selectedSeries])

  useDidShow(() => {
    loadDolls()
  })

  const handleSeriesSelect = () => {
    setShowSeriesModal(true)
  }

  const selectSeries = (name: string) => {
    setSelectedSeries(name)
    setShowSeriesModal(false)
  }

  // 拼单相关
  const pindanTotal = pindanItems.reduce((sum, item) => {
    const itemTotal = ((item.price || 0) + (item.accessoriesPrice || 0)) * item.quantity
    return sum + itemTotal
  }, 0)
  const pindanTotalQty = pindanItems.reduce((sum, item) => sum + item.quantity, 0)

  // 箱子信息
  const firstItem = pindanItems[0]
  const boxSize = firstItem?.boxSize || 'small'
  const boxSizeLabel = boxSize === 'small' ? '小箱' : boxSize === 'medium' ? '中箱' : boxSize === 'large' ? '大箱' : '小箱'
  const getBoxCapacity = () => {
    if (!firstItem) return 0
    if (boxSize === 'small') return firstItem.smallBoxCapacity || 0
    if (boxSize === 'medium') return firstItem.mediumBoxCapacity || 0
    if (boxSize === 'large') return firstItem.largeBoxCapacity || 0
    return 0
  }
  const boxCapacity = getBoxCapacity()
  const remainingCapacity = boxCapacity - pindanTotalQty

  const canCompletePindan = pindanItems.length > 0 && pindanItems.every(item => item.quantity >= item.minQuantity) && remainingCapacity <= 0

  console.log('[doll-list] DEBUG:', JSON.stringify(pindanItems.map(i => ({
    name: i.name,
    quantity: i.quantity,
    minQuantity: i.minQuantity,
    pass: i.quantity >= i.minQuantity
  }))))
  console.log('[doll-list] canCompletePindan:', canCompletePindan, 'remainingCapacity:', remainingCapacity)

  const handleCompletePindan = async () => {
    console.log('[doll-list] canCompletePindan:', canCompletePindan, 'pindanItems:', pindanItems.map(i => ({ name: i.name, quantity: i.quantity, minQuantity: i.minQuantity })))
    if (!canCompletePindan) {
      const totalShortage = pindanItems.reduce((sum, item) => {
        if (item.quantity < item.minQuantity) {
          return sum + (item.minQuantity - item.quantity)
        }
        return sum
      }, 0)
      Taro.showToast({ title: `未达起购数量，还差${totalShortage}个`, icon: 'none' })
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
      clearPindan()
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (e: any) {
      Taro.showToast({ title: e.message || '添加失败', icon: 'none' })
    }
  }

  const handleCancelPindan = () => {
    Taro.showModal({
      title: '确认取消拼单',
      content: '确定要取消拼单吗？已添加的商品将被移除',
      success: (res) => {
        if (res.confirm) {
          clearPindan()
        }
      }
    })
  }

  return (
    <View className="page-doll-list" style={{ paddingBottom: isPindanMode ? '140px' : '12px' }}>
      {/* 搜索和筛选 */}
      <View className="filter-bar">
        <View className="filter-row">
          <View className="search-wrap">
            <Text className="search-icon">🔍</Text>
            <Input
              className="search-input"
              placeholder="搜索名称/系列/配饰"
              value={keyword}
              onInput={(e: any) => setKeyword(e.detail.value)}
            />
            {keyword ? (
              <Text className="clear-btn" onClick={() => setKeyword('')}>✕</Text>
            ) : null}
          </View>
          <Button className="series-btn" onClick={handleSeriesSelect}>
            <Text className="series-btn-text">{selectedSeries || '全部系列'}</Text>
            <Text className="series-btn-arrow">▼</Text>
          </Button>
        </View>
        {selectedSeries ? (
          <View className="filter-tip">
            <Text className="filter-tip-text">当前筛选：{selectedSeries}</Text>
            <Text className="filter-tip-clear" onClick={() => setSelectedSeries('')}>清除</Text>
          </View>
        ) : null}
      </View>

      {/* 拼单模式提示 */}
      {isPindanMode && (
        <View className="pindan-tip">
          <Text className="pindan-tip-text">拼单模式 - 请添加商品达到起购量</Text>
          <View className="pindan-tip-close" onClick={() => setShowPindanPool(true)}>
            <Text className="text-white">查看拼单池</Text>
          </View>
        </View>
      )}

      {/* 娃娃列表 */}
      <View className="product-list">
        {loading ? (
          <View className="loading-tip"><Text className="text-gray-400 text-sm">加载中...</Text></View>
        ) : dolls.length === 0 ? (
          <View className="empty-tip"><Text className="text-gray-400 text-sm">暂无娃娃</Text></View>
        ) : (
          dolls.map(doll => (
            <View
              key={doll.id}
              className="product-card"
              onClick={() => navigateTo({ url: `/pages/doll-detail/index?id=${doll.id}` })}
            >
              <Image
                className="product-image"
                src={doll.images?.[0] || 'https://picsum.photos/160/160'}
                mode="aspectFill"
              />
              <View className="product-info">
                <Text className="product-name">{doll.name}</Text>
                <Text className="product-meta">
                  {doll.series || '基础款'}
                </Text>
                {doll.defaultAccessory ? (
                  <Text className="product-accessories">默认配饰: {doll.defaultAccessory}</Text>
                ) : null}
                <Text className="product-price">¥{doll.price || 0}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 系列选择弹窗 */}
      {showSeriesModal && (
        <View className="modal-mask" onClick={() => setShowSeriesModal(false)}>
          <View className="modal-content" onClick={(e) => e.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">选择系列</Text>
              <Text className="modal-close" onClick={() => setShowSeriesModal(false)}>✕</Text>
            </View>
            <View className="modal-body">
              <View
                className={`series-item ${selectedSeries === '' ? 'active' : ''}`}
                onClick={() => selectSeries('')}
              >
                <Text className="series-item-text">全部系列</Text>
                {selectedSeries === '' && <Text className="series-item-check">✓</Text>}
              </View>
              {seriesList.map((s: any) => (
                <View
                  key={s.id}
                  className={`series-item ${selectedSeries === s.name ? 'active' : ''}`}
                  onClick={() => selectSeries(s.name)}
                >
                  <Text className="series-item-text">{s.name}</Text>
                  {selectedSeries === s.name && <Text className="series-item-check">✓</Text>}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 拼单底部栏 */}
      {isPindanMode && (
        <View className="pindan-bar">
          <View className="pindan-info" onClick={() => setShowPindanPool(!showPindanPool)}>
            <View className="pindan-count">
              <Text className="pindan-count-num">{pindanItems.length}</Text>
              <Text className="pindan-count-text">种商品</Text>
            </View>
            <View className="pindan-summary">
              <Text className="pindan-summary-text">
                共{pindanTotalQty}件 ¥{pindanTotal.toFixed(2)}
              </Text>
            </View>
            <Text className="pindan-arrow">{showPindanPool ? '▼' : '▲'}</Text>
          </View>
          <View className="pindan-actions">
            <Button className="pindan-cancel-btn" onClick={handleCancelPindan}>取消拼单</Button>
            <Button
              className={`pindan-complete-btn ${canCompletePindan ? 'active' : ''}`}
              onClick={handleCompletePindan}
            >
              完成拼单
            </Button>
          </View>
        </View>
      )}

      {/* 拼单池详情 */}
      {isPindanMode && showPindanPool && (
        <View className="pindan-pool-modal">
          <View className="pool-mask" onClick={() => setShowPindanPool(false)} />
          <View className="pool-content">
            <View className="pool-header">
              <Text className="pool-title">拼单池 - {boxSizeLabel}</Text>
              <Text className="pool-subtitle">
                {remainingCapacity > 0
                  ? `可装约${boxCapacity}个，还差${remainingCapacity}个`
                  : remainingCapacity === 0
                    ? `已装满${boxCapacity}个`
                    : `已超出${Math.abs(remainingCapacity)}个`}
              </Text>
              <Text className="pool-close" onClick={() => setShowPindanPool(false)}>✕</Text>
            </View>
            <ScrollView scrollY className="pool-body">
              {pindanItems.length === 0 ? (
                <View className="pool-empty">
                  <Text className="text-gray-400">拼单池为空</Text>
                </View>
              ) : (
                pindanItems.map(item => (
                  <View key={item.itemId} className="pool-item">
                    <Image className="pool-item-image" src={item.coverImage} mode="aspectFill" />
                    <View className="pool-item-info">
                      <Text className="pool-item-name">{item.name}</Text>
                      <Text className="pool-item-price">¥{(((item.price || 0) + (item.accessoriesPrice || 0)) * item.quantity).toFixed(2)}</Text>
                    </View>
                    <View className="pool-item-qty">
                      <View className="qty-adjust">
                        <Text className="qty-btn" onClick={() => updatePindanItemQuantity(item.itemId, Math.max(1, item.quantity - 1))}>-</Text>
                        <Input
                          className="qty-input"
                          type="number"
                          value={String(item.quantity)}
                          onInput={(e: any) => {
                            const val = e.detail.value
                            if (val === '') {
                              // Allow empty while typing
                              return
                            }
                            const num = parseInt(val)
                            if (!isNaN(num) && num >= 1) {
                              updatePindanItemQuantity(item.itemId, num)
                            }
                          }}
                          onBlur={(e: any) => {
                            const val = e.detail.value
                            const num = parseInt(val) || 1
                            updatePindanItemQuantity(item.itemId, Math.max(1, num))
                          }}
                        />
                        <Text className="qty-btn" onClick={() => updatePindanItemQuantity(item.itemId, item.quantity + 1)}>+</Text>
                      </View>
                      {item.quantity < item.minQuantity && (
                        <Text className="qty-tip">（差{item.minQuantity - item.quantity}件）</Text>
                      )}
                    </View>
                    <View className="pool-item-remove" onClick={() => removeFromPindan(item.itemId)}>
                      <Text className="remove-text">删除</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}
