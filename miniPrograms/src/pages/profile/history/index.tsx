import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import { navigateTo, showToast } from '@tarojs/taro'
import { api } from '../../../services/api'
import './index.scss'

export default function HistoryPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const res = await api.browse.history()
      setList(res.data || [])
    } catch (e: any) {
      showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="page-list">
      {loading ? (
        <View className="loading"><Text className="text-gray-400">加载中...</Text></View>
      ) : list.length === 0 ? (
        <View className="empty"><Text className="text-gray-400">暂无浏览记录</Text></View>
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
          </View>
        ))
      )}
    </View>
  )
}
