import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { showToast } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import CartModal from '../../components/CartModal'
import './index.scss'

interface Accessory {
  id: string
  name: string
  price: number
  images?: string[]
}

export default function OutfitDetailPage() {
  const { userInfo, setCartCount } = useGlobalState()
  const [outfit, setOutfit] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCartModal, setShowCartModal] = useState(false)
  // 配饰选择相关状态
  const [showAccessoryModal, setShowAccessoryModal] = useState(false)
  const [allAccessories, setAllAccessories] = useState<Accessory[]>([])
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([])
  const [savedAccessories, setSavedAccessories] = useState<Accessory[]>([])

  useEffect(() => {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    const { id, type } = (page as any).options || {}
    if (id) loadDetail(id, type)
  }, [])

  const loadDetail = async (id: string, type: string) => {
    setLoading(true)
    try {
      let res
      if (type === 'custom') {
        res = await api.outfit.userList()
        const found = (res.data || []).find((o: any) => o.id === id)
        setOutfit(found)
      } else {
        res = await api.outfit.detail(id)
        setOutfit(res.data)
      }
      if (userInfo) {
        api.browse.add({ item_type: 'outfit', item_id: id }).catch(() => {})
      }
    } catch (e) {
      console.error('加载失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCollect = async () => {
    if (!userInfo) { showToast({ title: '请先登录', icon: 'none' }); return }
    try {
      await api.favorites.add({ item_type: 'outfit', item_id: outfit.id })
      showToast({ title: '已收藏', icon: 'success' })
    } catch (e: any) {
      showToast({ title: e.message || '收藏失败', icon: 'none' })
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

  const handleOpenAccessoryModal = async () => {
    await loadAllAccessories()
    setShowAccessoryModal(true)
  }

  const handleAccessoryConfirm = () => {
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

  const handleAddToCart = async () => {
    if (!userInfo) { showToast({ title: '请先登录', icon: 'none' }); return }
    try {
      // 如果用户没有选择额外配饰，不传accessories，让后端自动使用搭配方案的默认配饰
      const accessories = savedAccessories.map(acc => ({ id: acc.id, name: acc.name, price: acc.price }))
      const params: any = {
        item_type: 'outfit',
        item_id: outfit.id,
        quantity: 1,
      }
      // 只有用户选择了额外配饰时才传递
      if (accessories.length > 0) {
        params.accessories = accessories
      }

      await api.cart.add(params)
      showToast({ title: '已加入购物车', icon: 'success' })
      const res = await api.cart.list()
      setCartCount(res.data?.length || 0)
    } catch (e: any) {
      showToast({ title: e.message || '添加失败', icon: 'none' })
    }
  }

  if (loading) return <View className="loading-wrap"><Text className="text-gray-400">加载中...</Text></View>
  if (!outfit) return <View className="loading-wrap"><Text className="text-gray-400">搭配方案不存在</Text></View>

  const accessories = outfit.accessories || []

  return (
    <View className="page-detail">
      {/* 商品图片 */}
      <Image
        className="cover-image"
        src={outfit.cover_image || 'https://picsum.photos/375/400'}
        mode="aspectFill"
      />

      {/* 价格区域 */}
      <View className="price-section">
        <View className="price-row">
          <Text className="price-label">¥</Text>
          <Text className="price-value">{outfit.total_price}</Text>
        </View>
      </View>

      {/* 商品信息 */}
      <View className="goods-section">
        <Text className="goods-name">{outfit.name}</Text>
      </View>

      {/* 商品参数 */}
      <View className="specs-section">
        <View className="specs-title">商品参数</View>
        <View className="specs-list">
          {outfit.series && (
            <View className="specs-item">
              <Text className="specs-label">系列</Text>
              <Text className="specs-value">{outfit.series}</Text>
            </View>
          )}
          {outfit.doll_name && (
            <View className="specs-item">
              <Text className="specs-label">系列</Text>
              <Text className="specs-value">{outfit.doll_name}</Text>
            </View>
          )}
          {outfit.size && (
            <View className="specs-item">
              <Text className="specs-label">尺寸</Text>
              <Text className="specs-value">{outfit.size}</Text>
            </View>
          )}
          {outfit.material && (
            <View className="specs-item">
              <Text className="specs-label">材质</Text>
              <Text className="specs-value">{outfit.material}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 默认配饰 */}
      {accessories.length > 0 && (
        <View className="accessories-section">
          <View className="section-title">默认配饰</View>
          <Text className="accessories-text">{accessories.map((acc: any) => acc.name).join(' + ').slice(0, 20)}{accessories.map((acc: any) => acc.name).join(' + ').length > 20 ? '...' : ''}</Text>
        </View>
      )}

      {/* 自定义搭配配饰 */}
      {savedAccessories.length > 0 && (
        <View className="custom-accessories-section">
          <View className="section-title">已选配饰</View>
          <ScrollView scrollX className="custom-accessories-scroll">
            {savedAccessories.map(acc => (
              <View key={acc.id} className="custom-accessory-item">
                <Image
                  className="custom-accessory-image"
                  src={acc.images?.[0] || 'https://picsum.photos/60/60'}
                  mode="aspectFill"
                />
                <Text className="custom-accessory-name">{acc.name}</Text>
                <Text className="custom-accessory-price">¥{acc.price}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 商品详情 */}
      {outfit.description && (
        <View className="detail-section">
          <View className="section-title">商品详情</View>
          <Text className="detail-text">{outfit.description}</Text>
        </View>
      )}

      {/* 专利信息 */}
      {outfit.patent_no && (
        <View className="detail-section">
          <View className="section-title">专利信息</View>
          <Text className="detail-text">{outfit.patent_no}</Text>
        </View>
      )}

      {/* 底部占位 */}
      <View className="bottom-placeholder" />

      {/* 底部操作栏 */}
      <View className="action-bar">
        <View className="action-icon-btn" onClick={handleCollect}>
          <Text className="action-icon">☆</Text>
          <Text className="action-label">收藏</Text>
        </View>
        <View className="action-btn accessory-btn" onClick={handleOpenAccessoryModal}>
          <Text className="action-text">{savedAccessories.length > 0 ? `已搭配${savedAccessories.length}个` : '搭配配饰'}</Text>
        </View>
        <View className="action-cart-btn" onClick={() => setShowCartModal(true)}>
          <Text className="cart-btn-text">加入购物车</Text>
        </View>
      </View>

      {/* 购物车弹窗 */}
      <CartModal
        item={outfit}
        itemType="outfit"
        show={showCartModal}
        onClose={() => setShowCartModal(false)}
      />

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
