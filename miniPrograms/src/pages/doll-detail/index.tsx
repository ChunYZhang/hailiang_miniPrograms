import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import { showToast, switchTab } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

interface Accessory {
  id: string
  name: string
  price: number
  images?: string[]
  coverImage?: string
  selectedPrice?: number
}

export default function DollDetailPage() {
  const { userInfo, setCartCount, isPindanMode, pindanItems, addToPindan, createPindanGroup, enterPindanMode } = useGlobalState()
  const [doll, setDoll] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isFavorited, setIsFavorited] = useState(false)
  // 配饰选择相关状态
  const [showAccessoryModal, setShowAccessoryModal] = useState(false)
  const [allAccessories, setAllAccessories] = useState<Accessory[]>([])
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([])
  const [savedAccessories, setSavedAccessories] = useState<Accessory[]>([])
  // 购物车确认弹窗
  const [showCartConfirm, setShowCartConfirm] = useState(false)
  // 箱子选择
  const [selectedBoxSize, setSelectedBoxSize] = useState<'small' | 'medium' | 'large'>('small')

  useEffect(() => {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    const id = (page as any).options?.id
    if (id) loadDetail(id)
  }, [])

  // 获取当前箱子容量
  const getBoxCapacity = () => {
    if (!doll) return 0
    if (selectedBoxSize === 'small') return doll.smallBoxCapacity || doll.small_box_capacity || 0
    if (selectedBoxSize === 'medium') return doll.mediumBoxCapacity || doll.medium_box_capacity || 0
    return doll.largeBoxCapacity || doll.large_box_capacity || 0
  }

  // 获取箱子尺寸标签
  const getBoxSizeLabel = () => {
    if (selectedBoxSize === 'small') return '小箱'
    if (selectedBoxSize === 'medium') return '中箱'
    return '大箱'
  }

  useEffect(() => {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    const id = (page as any).options?.id
    if (id) loadDetail(id)
  }, [])

  const loadDetail = async (id: string) => {
    setLoading(true)
    // 重置配饰选择状态，每次进入都重新选择
    setSavedAccessories([])
    setSelectedAccessoryIds([])
    try {
      const res = await api.doll.detail(id)
      setDoll(res.data)
      setIsFavorited(res.data?.isFavorited || false)
      if (userInfo) {
        api.browse.add({ item_type: 'doll', item_id: id }).catch(() => {})
      }
    } catch (e) {
      console.error('加载失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCollect = async () => {
    if (!userInfo) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    try {
      if (isFavorited) {
        await api.favorites.removeByItem({ item_type: 'doll', item_id: doll.id })
        setIsFavorited(false)
        showToast({ title: '已取消收藏', icon: 'success' })
      } else {
        await api.favorites.add({ item_type: 'doll', item_id: doll.id })
        setIsFavorited(true)
        showToast({ title: '已收藏', icon: 'success' })
      }
    } catch (e: any) {
      showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  }

  const loadAllAccessories = async () => {
    try {
      // 优先加载娃娃搭配方案中的配饰
      const outfitRes = await api.doll.outfitAccessories(doll.id)
      if (outfitRes.data && outfitRes.data.length > 0) {
        setAllAccessories(outfitRes.data)
      } else {
        // 如果没有搭配方案，加载全部配饰
        const res = await api.accessory.list({ page_size: 100 })
        setAllAccessories(res.data || [])
      }
    } catch (e) {
      console.error('加载配饰失败', e)
    }
  }

  const handleOpenAccessoryModal = async () => {
    await loadAllAccessories()
    setShowAccessoryModal(true)
  }

  const handleAccessoryConfirm = () => {
    // 保存选中的配饰
    const selected = allAccessories.filter(acc => selectedAccessoryIds.includes(acc.id))
    setSavedAccessories(selected)
    setShowAccessoryModal(false)
    if (selected.length > 0) {
      showToast({ title: `已保存${selected.length}个配饰`, icon: 'success' })
    }
  }

  const handleAccessoryCancel = () => {
    setSelectedAccessoryIds([])
    setShowAccessoryModal(false)
  }

  const handleOpenCartConfirm = () => {
    if (!userInfo) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    setQuantity(1)
    setSelectedBoxSize('small')
    setShowCartConfirm(true)
  }

  const handleConfirmAddToCart = async () => {
    try {
      const accessories = savedAccessories.map(acc => ({ id: acc.id, name: acc.name, price: acc.price }))
      await api.cart.add({
        item_type: 'doll',
        item_id: doll.id,
        accessories: accessories,
        quantity: quantity,
        box_size: selectedBoxSize,
      })
      showToast({ title: '已加入购物车', icon: 'success' })
      setShowCartConfirm(false)
      const res = await api.cart.list()
      setCartCount(res.data?.length || 0)
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
    const accessories = savedAccessories.map(acc => ({ id: acc.id, name: acc.name, price: acc.price }))
    const { groupId, groupName } = createPindanGroup(userInfo?.nickname)

    addToPindan({
      id: Date.now().toString(),
      itemType: 'doll',
      itemId: doll.id,
      name: doll.name,
      price: Number(dollPrice) || 0,
      accessoriesPrice: Number(accessoriesPrice) || 0,
      coverImage: images[0] || '',
      quantity,
      accessories,
      minQuantity: doll.minQuantity || doll.min_quantity || 1,
      pindanGroupId: groupId,
      pindanGroupName: groupName,
      boxSize: selectedBoxSize,
      smallBoxCapacity: doll.smallBoxCapacity || doll.small_box_capacity || 0,
      mediumBoxCapacity: doll.mediumBoxCapacity || doll.medium_box_capacity || 0,
      largeBoxCapacity: doll.largeBoxCapacity || doll.large_box_capacity || 0,
    })
    enterPindanMode()
    setShowCartConfirm(false)
    showToast({ title: '已进入拼单模式', icon: 'none' })
    switchTab({ url: '/pages/doll-list/index' })
  }

  // 加入拼单池（拼单模式下）
  const handleAddToPindanPool = () => {
    if (!userInfo) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const accessories = savedAccessories.map(acc => ({ id: acc.id, name: acc.name, price: acc.price }))
    const firstItem = pindanItems[0]
    // 如果已有拼单商品，沿用同一个箱尺寸；否则使用当前选择的
    const poolBoxSize = firstItem?.boxSize || selectedBoxSize
    const { groupId, groupName } = firstItem?.pindanGroupId
      ? { groupId: firstItem.pindanGroupId, groupName: firstItem.pindanGroupName }
      : createPindanGroup(userInfo?.nickname)

    addToPindan({
      id: Date.now().toString(),
      itemType: 'doll',
      itemId: doll.id,
      name: doll.name,
      price: Number(dollPrice) || 0,
      accessoriesPrice: Number(accessoriesPrice) || 0,
      coverImage: images[0] || '',
      quantity,
      accessories,
      minQuantity: doll.minQuantity || doll.min_quantity || 1,
      pindanGroupId: groupId,
      pindanGroupName: groupName,
      boxSize: poolBoxSize,
      smallBoxCapacity: doll.smallBoxCapacity || doll.small_box_capacity || 0,
      mediumBoxCapacity: doll.mediumBoxCapacity || doll.medium_box_capacity || 0,
      largeBoxCapacity: doll.largeBoxCapacity || doll.large_box_capacity || 0,
    })
    showToast({ title: '已加入拼单池', icon: 'success' })
    switchTab({ url: '/pages/doll-list/index' })
  }

  // 计算总价
  const dollPrice = Number(doll?.price) || 0
  const accessoriesPrice = savedAccessories.reduce((sum: number, acc: any) => sum + (Number(acc.price) || 0), 0)
  const totalPrice = (dollPrice + accessoriesPrice) * quantity

  if (loading) return <View className="loading-wrap"><Text className="text-gray-400">加载中...</Text></View>
  if (!doll) return <View className="loading-wrap"><Text className="text-gray-400">商品不存在</Text></View>

  const images = doll.images || []

  return (
    <View className="page-detail">
      {/* 图片轮播 */}
      <View className="image-wrap">
        {images.length > 0 ? (
          <Swiper className="image-swiper" onChange={e => setCurrentIdx(e.detail.current)}>
            {images.map((img: string, idx: number) => (
              <SwiperItem key={idx}>
                <Image className="detail-image" src={img} mode="aspectFill" />
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <Image className="detail-image placeholder" src="https://picsum.photos/375/400" mode="aspectFill" />
        )}
        {images.length > 1 && (
          <View className="image-indicator">
            <Text className="text-white text-xs">{currentIdx + 1}/{images.length}</Text>
          </View>
        )}
      </View>

      {/* 商品信息 */}
      <View className="info-section">
        <Text className="detail-price">¥{Number(doll.price).toFixed(2)}</Text>
        <Text className="detail-name">{doll.name}</Text>
        <View className="detail-tags">
          {doll.series && <View className="tag"><Text>{doll.series}</Text></View>}
          {doll.size && <View className="tag"><Text>{doll.size}</Text></View>}
          {doll.material && <View className="tag"><Text>{doll.material}</Text></View>}
          {doll.defaultAccessory && <View className="tag tag-rose"><Text>默认配饰: {doll.defaultAccessory}</Text></View>}
        </View>
      </View>

      {/* 已保存的配饰 */}
      {savedAccessories.length > 0 && (
        <View className="desc-section">
          <Text className="section-title">已搭配配饰</Text>
          <View className="saved-accessories">
            {savedAccessories.map(acc => (
              <View key={acc.id} className="saved-accessory-item">
                <Text className="saved-accessory-name">{acc.name}</Text>
                <Text className="saved-accessory-price">¥{acc.price}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 详情描述 */}
      {doll.description && (
        <View className="desc-section">
          <Text className="section-title">商品详情</Text>
          <Text className="desc-text">{doll.description}</Text>
        </View>
      )}

      {/* 专利信息 */}
      {doll.patent_no && (
        <View className="desc-section">
          <Text className="section-title">专利信息</Text>
          <Text className="desc-text">{doll.patent_no}</Text>
        </View>
      )}

      {/* 底部操作栏 */}
      <View className="action-bar">
        <View className="action-btn" onClick={handleCollect}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorited ? "#f59e0b" : "none"} stroke={isFavorited ? "#f59e0b" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <Text className={`action-text ${isFavorited ? 'text-amber-500' : ''}`}>{isFavorited ? '已收藏' : '收藏'}</Text>
        </View>
        <View className="action-btn accessory-btn" onClick={handleOpenAccessoryModal}>
          <Text className="action-text">{savedAccessories.length > 0 ? `已搭配${savedAccessories.length}个` : '搭配配饰'}</Text>
        </View>
        <View className="action-btn cart-btn" onClick={handleOpenCartConfirm}>
          <Text className="action-text-white">{isPindanMode ? '加入拼单池' : '加入购物车'}</Text>
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

      {/* 购物车确认弹窗 */}
      {showCartConfirm && (
        <View className="accessory-modal">
          <View className="accessory-modal-mask" onClick={() => setShowCartConfirm(false)} />
          <View className="accessory-modal-content cart-confirm-modal">
            <View className="modal-header">
              <Text className="modal-title">确认订单</Text>
              <View className="modal-close" onClick={() => setShowCartConfirm(false)}>✕</View>
            </View>
            <ScrollView scrollY className="modal-body">
              {/* 娃娃信息 */}
              <View className="confirm-doll-section">
                <Image
                  className="confirm-doll-image"
                  src={images[0] || 'https://picsum.photos/100/100'}
                  mode="aspectFill"
                />
                <View className="confirm-doll-info">
                  <Text className="confirm-doll-name">{doll.name}</Text>
                  <Text className="confirm-doll-price">¥{(Number(doll.price) || 0).toFixed(2)}</Text>
                </View>
              </View>

              {/* 箱子选择 - 拼单模式下不显示 */}
              {!isPindanMode && (
                <View className="confirm-box-section">
                  <Text className="confirm-section-title">选择箱子</Text>
                  <View className="box-selector">
                    {doll.smallBoxCapacity > 0 && (
                      <View
                        className={`box-option ${selectedBoxSize === 'small' ? 'selected' : ''}`}
                        onClick={() => setSelectedBoxSize('small')}
                      >
                        <Text className="box-option-label">小箱</Text>
                        <Text className="box-option-capacity">可装{doll.smallBoxCapacity}个</Text>
                      </View>
                    )}
                    {doll.mediumBoxCapacity > 0 && (
                      <View
                        className={`box-option ${selectedBoxSize === 'medium' ? 'selected' : ''}`}
                        onClick={() => setSelectedBoxSize('medium')}
                      >
                        <Text className="box-option-label">中箱</Text>
                        <Text className="box-option-capacity">可装{doll.mediumBoxCapacity}个</Text>
                      </View>
                    )}
                    {doll.largeBoxCapacity > 0 && (
                      <View
                        className={`box-option ${selectedBoxSize === 'large' ? 'selected' : ''}`}
                        onClick={() => setSelectedBoxSize('large')}
                      >
                        <Text className="box-option-label">大箱</Text>
                        <Text className="box-option-capacity">可装{doll.largeBoxCapacity}个</Text>
                      </View>
                    )}
                    {doll.smallBoxCapacity === 0 && doll.mediumBoxCapacity === 0 && doll.largeBoxCapacity === 0 && (
                      <Text className="text-gray-400 text-sm">该商品未设置箱子容量</Text>
                    )}
                  </View>
                </View>
              )}

              {/* 配饰列表 */}
              {savedAccessories.length > 0 && (
                <View className="confirm-accessories-section">
                  <Text className="confirm-section-title">已选配饰</Text>
                  {savedAccessories.map((acc: any) => (
                    <View key={acc.id} className="confirm-accessory-item">
                      <View className="confirm-accessory-left">
                        <Image
                          className="confirm-accessory-image"
                          src={acc.images?.[0] || 'https://picsum.photos/50/50'}
                          mode="aspectFill"
                        />
                        <Text className="confirm-accessory-name">{acc.name}</Text>
                      </View>
                      <Text className="confirm-accessory-price">¥{acc.price}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 数量选择 */}
              <View className="confirm-quantity-section">
                <Text className="confirm-quantity-label">{isPindanMode ? '数量' : '箱数'}</Text>
                <View className="quantity-selector">
                  <View
                    className={`quantity-btn ${quantity <= 1 ? 'disabled' : ''}`}
                    onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                  >
                    <Text className="quantity-btn-text">-</Text>
                  </View>
                  <View className="quantity-value">
                    <Text className="quantity-num">{quantity}</Text>
                  </View>
                  <View
                    className="quantity-btn"
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    <Text className="quantity-btn-text">+</Text>
                  </View>
                </View>
              </View>

              {/* 价格明细 */}
              <View className="confirm-price-section">
                <View className="price-row">
                  <Text className="price-label">娃娃单价</Text>
                  <Text className="price-value">¥{(Number(doll.price) || 0).toFixed(2)}</Text>
                </View>
                {savedAccessories.length > 0 && (
                  <View className="price-row">
                    <Text className="price-label">配饰价格</Text>
                    <Text className="price-value">¥{accessoriesPrice.toFixed(2)}</Text>
                  </View>
                )}
                <View className="price-row">
                  <Text className="price-label">{isPindanMode ? '数量' : '箱数'}</Text>
                  <Text className="price-value">×{quantity} {isPindanMode ? '个' : getBoxSizeLabel()}</Text>
                </View>
                <View className="price-row total-row">
                  <Text className="total-label">合计</Text>
                  <Text className="total-value">¥{totalPrice.toFixed(2)}</Text>
                </View>
              </View>
            </ScrollView>
            <View className="modal-footer">
              <View className="modal-btn cancel" onClick={() => setShowCartConfirm(false)}>取消</View>
              {isPindanMode ? (
                <View className="modal-btn confirm" onClick={handleAddToPindanPool}>加入拼单池</View>
              ) : (
                <>
                  <View className="modal-btn pindan" onClick={handleStartPindan}>发起拼单</View>
                  <View className="modal-btn confirm" onClick={handleConfirmAddToCart}>确认加入</View>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
