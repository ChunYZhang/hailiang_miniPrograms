import { useState, useEffect } from 'react'
import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { navigateTo, switchTab, useDidShow } from '@tarojs/taro'
import { api } from '../../services/api'
import './index.scss'

export default function HomePage() {
  const [banners, setBanners] = useState<any[]>([])
  const [recommended, setRecommended] = useState<{ hotDolls: any[] }>({
    hotDolls: [],
  })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [bannerRes, recRes] = await Promise.all([
        api.home.banners(),
        api.home.recommended(),
      ])
      setBanners(bannerRes.data || [])
      setRecommended(recRes.data || { hotDolls: [], hotAccessories: [], hotOutfits: [] })
    } catch (e) {
      console.error('加载数据失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 页面每次显示时刷新数据
  useDidShow(() => {
    loadData()
  })

  // 每30秒自动刷新
  useEffect(() => {
    const timer = setInterval(loadData, 30000)
    return () => clearInterval(timer)
  }, [])

  const allHotItems = [
    ...recommended.hotDolls.map(d => ({ ...d, _type: 'doll' })),
  ]

  return (
    <View className="page-home">
      {/* 顶部轮播图 */}
      <View className="banner-section">
        {banners.length > 0 ? (
          <Swiper
            className="banner-swiper"
            autoplay
            circular
            indicatorDots
          >
            {banners.map((banner: any, index: number) => (
              <SwiperItem key={banner.id || index}>
                <Image
                  className="banner-image"
                  src={banner.image}
                  mode="aspectFill"
                  onClick={() => {
                    const linkType = banner.linkType || banner.link_type
                    const linkId = banner.linkId || banner.link_id
                    if (linkType === 'doll' && linkId) {
                      navigateTo({ url: `/pages/doll-detail/index?id=${linkId}` })
                    } else if (linkType === 'accessory' && linkId) {
                      navigateTo({ url: `/pages/accessory-detail/index?id=${linkId}` })
                    } else if (linkType === 'outfit' && linkId) {
                      navigateTo({ url: `/pages/outfit-detail/index?id=${linkId}` })
                    }
                  }}
                />
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <View className="banner-placeholder">
            <Text className="text-gray-400 text-sm">暂无轮播图</Text>
          </View>
        )}
      </View>

      {/* 快捷入口 */}
      <View className="quick-entry">
        <View className="entry-item" onClick={() => navigateTo({ url: '/pages/doll-list/index' })}>
          <View className="entry-icon" style={{ background: '#fce7f3' }}>
            <Text style={{ fontSize: 24 }}>🧸</Text>
          </View>
          <Text className="entry-text">娃娃</Text>
        </View>
        <View className="entry-item" onClick={() => switchTab({ url: '/pages/company/index' })}>
          <View className="entry-icon" style={{ background: '#e0f2fe' }}>
            <Text style={{ fontSize: 24 }}>🏢</Text>
          </View>
          <Text className="entry-text">企业</Text>
        </View>
        <View className="entry-item" onClick={() => switchTab({ url: '/pages/cart/index' })}>
          <View className="entry-icon" style={{ background: '#fef3c7' }}>
            <Text style={{ fontSize: 24 }}>🛒</Text>
          </View>
          <Text className="entry-text">购物车</Text>
        </View>
      </View>

      {/* 热门推荐 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">热门推荐</Text>
        </View>
        {allHotItems.length === 0 ? (
          <View className="empty-tip">
            <Text className="text-gray-400 text-sm">暂无热门商品</Text>
          </View>
        ) : (
          <View className="hot-grid">
            {allHotItems.map((item: any) => (
              <View
                key={`${item._type}-${item.id}`}
                className="hot-card"
                onClick={() => navigateTo({ url: `/pages/doll-detail/index?id=${item.id}` })}
              >
                <Image
                  className="hot-cover"
                  src={item.images?.[0] || item.coverImage || item.cover_image}
                  mode="aspectFill"
                />
                <View className="hot-info">
                  <Text className="hot-name">{item.name}</Text>
                  <Text className="hot-price">¥{item.price}</Text>
                </View>
                <View className="hot-tag">
                  <Text className="tag-text">娃娃</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}