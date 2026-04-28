import { useState, useEffect } from 'react'
import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components'
import { navigateTo, showToast } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import CartModal from '../../components/CartModal'
import './index.scss'

export default function AccessoryDetailPage() {
  const { userInfo, setCartCount, isPindanMode } = useGlobalState()
  const [acc, setAcc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showCartModal, setShowCartModal] = useState(false)

  useEffect(() => {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    const id = (page as any).options?.id
    if (id) loadDetail(id)
  }, [])

  const loadDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await api.accessory.detail(id)
      setAcc(res.data)
      if (userInfo) {
        api.browse.add({ item_type: 'accessory', item_id: id }).catch(() => {})
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
      await api.favorites.add({ item_type: 'accessory', item_id: acc.id })
      showToast({ title: '已收藏', icon: 'success' })
    } catch (e: any) {
      showToast({ title: e.message || '收藏失败', icon: 'none' })
    }
  }

  const handleAddCart = () => {
    if (!userInfo) { showToast({ title: '请先登录', icon: 'none' }); return }
    setShowCartModal(true)
  }

  if (loading) return <View className="loading-wrap"><Text className="text-gray-400">加载中...</Text></View>
  if (!acc) return <View className="loading-wrap"><Text className="text-gray-400">商品不存在</Text></View>

  const images = acc.images || []
  const categoryMap: Record<string, string> = {
    headwear: '头饰', clothing: '衣服', shoes: '鞋子', props: '道具', giftbox: '礼盒'
  }

  return (
    <View className="page-detail">
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
        {images.length > 1 && <View className="image-indicator"><Text className="text-white text-xs">{currentIdx + 1}/{images.length}</Text></View>}
      </View>

      <View className="info-section">
        <Text className="detail-price">¥{acc.price}</Text>
        <Text className="detail-name">{acc.name}</Text>
        <View className="detail-tags">
          {acc.category && <View className="tag"><Text>{categoryMap[acc.category] || acc.category}</Text></View>}
          {acc.series && <View className="tag"><Text>{acc.series}</Text></View>}
          {acc.material && <View className="tag"><Text>{acc.material}</Text></View>}
        </View>
      </View>

      {acc.description && (
        <View className="desc-section">
          <Text className="section-title">商品详情</Text>
          <Text className="desc-text">{acc.description}</Text>
        </View>
      )}

      <View className="action-bar">
        <View className="action-btn" onClick={handleCollect}>
          <Text className="action-icon">⭐</Text>
          <Text className="action-text">收藏</Text>
        </View>
        <View className="action-btn cart-btn" onClick={handleAddCart}>
          <Text className="action-text-white">{isPindanMode ? '添加到拼单池' : '加入购物车'}</Text>
        </View>
      </View>

      <CartModal
        item={acc}
        itemType="accessory"
        show={showCartModal}
        onClose={() => setShowCartModal(false)}
      />
    </View>
  )
}
