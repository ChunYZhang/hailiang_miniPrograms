import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import { navigateTo, showToast } from '@tarojs/taro'
import { api } from '../../../services/api'
import './index.scss'

export default function FavoritesPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const res = await api.favorites.list()
      setList(res.data || [])
    } catch (e: any) {
      showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await api.favorites.remove(id)
      showToast({ title: '已取消', icon: 'success' })
      loadFavorites()
    } catch (e: any) {
      showToast({ title: e.message || '删除失败', icon: 'none' })
    }
  }

  return (
    <View className="page-list">
      {loading ? (
        <View className="loading"><Text className="text-gray-400">加载中...</Text></View>
      ) : list.length === 0 ? (
        <View className="empty"><Text className="text-gray-400">暂无收藏</Text></View>
      ) : (
        list.map(item => (
          <View
            key={item.id}
            className="item-row"
            onClick={() => {
              if (item.item_type === 'doll') navigateTo({ url: `/pages/doll-detail/index?id=${item.item_id}` })
              else if (item.item_type === 'accessory') navigateTo({ url: `/pages/accessory-detail/index?id=${item.item_id}` })
              else navigateTo({ url: `/pages/outfit-detail/index?id=${item.item_id}` })
            }}
          >
            <Image className="item-image" src={item.coverImage || 'https://picsum.photos/80/80'} mode="aspectFill" />
            <View className="item-info">
              <Text className="item-name">{item.name}</Text>
              <Text className="item-price">¥{item.price}</Text>
            </View>
            <View className="item-action" onClick={e => { e.stopPropagation(); handleRemove(item.id) }}>
              <Text className="text-gray-400 text-xs">取消</Text>
            </View>
          </View>
        ))
      )}
    </View>
  )
}
