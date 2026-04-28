import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { navigateTo, useDidShow } from '@tarojs/taro'
import { api } from '../../services/api'
import './index.scss'

export default function AccessoryListPage() {
  const [accessories, setAccessories] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [series, setSeries] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [activeSeries, setActiveSeries] = useState('')
  const [loading, setLoading] = useState(true)
  const [showFilter, setShowFilter] = useState(false)

  const loadFilters = async () => {
    try {
      const [catRes, serRes] = await Promise.all([
        api.category.list(),
        api.series.list(),
      ])
      const accSeries = (serRes.data || []).filter((s: any) => s.type === 'accessory' || s.type === 'both')
      setCategories(catRes.data || [])
      setSeries(accSeries)
    } catch (e) {
      console.error('加载筛选条件失败', e)
    }
  }

  const loadAccessories = async () => {
    setLoading(true)
    try {
      const res = await api.accessory.list({
        category: activeCategory || undefined,
        series: activeSeries || undefined,
      })
      setAccessories(res.data || [])
    } catch (e) {
      console.error('加载配饰列表失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFilters()
  }, [])

  useEffect(() => {
    loadAccessories()
  }, [activeCategory, activeSeries])

  useDidShow(() => {
    loadFilters()
    loadAccessories()
  })

  return (
    <View className="page-acc-list">
      {/* 顶部筛选栏 */}
      <View className="top-filters">
        <ScrollView className="filter-row" scrollX>
          <View
            className={`filter-tag ${activeCategory === '' && activeSeries === '' ? 'active' : ''}`}
            onClick={() => { setActiveCategory(''); setActiveSeries('') }}
          >
            全部
          </View>
          {categories.map(c => (
            <View
              key={c.id}
              className={`filter-tag ${activeCategory === c.value ? 'active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === c.value ? '' : c.value)}
            >
              {c.name}
            </View>
          ))}
        </ScrollView>
        <View className="filter-more" onClick={() => setShowFilter(!showFilter)}>
          <Text className="text-xs text-gray-500">{showFilter ? '收起' : '更多筛选'}</Text>
        </View>
      </View>

      {/* 展开的系列筛选 */}
      {showFilter && (
        <View className="series-filter">
          <Text className="filter-label">系列：</Text>
          <View className="filter-tags">
            {series.map(s => (
              <View
                key={s.id}
                className={`filter-tag-sm ${activeSeries === s.name ? 'active' : ''}`}
                onClick={() => setActiveSeries(activeSeries === s.name ? '' : s.name)}
              >
                {s.name}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 商品列表 */}
      <View className="product-list">
        {loading ? (
          <View className="loading-tip"><Text className="text-gray-400 text-sm">加载中...</Text></View>
        ) : accessories.length === 0 ? (
          <View className="empty-tip"><Text className="text-gray-400 text-sm">暂无配饰商品</Text></View>
        ) : (
          accessories.map(acc => (
            <View
              key={acc.id}
              className="product-card"
              onClick={() => navigateTo({ url: `/pages/accessory-detail/index?id=${acc.id}` })}
            >
              <Image
                className="product-image"
                src={acc.coverImage || acc.images?.[0] || 'https://picsum.photos/160/160'}
                mode="aspectFill"
              />
              <View className="product-info">
                <Text className="product-name">{acc.name}</Text>
                <Text className="product-meta">{acc.material}</Text>
                <Text className="product-price">¥{acc.price}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  )
}
