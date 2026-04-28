import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { showToast, useDidShow } from '@tarojs/taro'
import { api } from '../../../services/api'
import './index.scss'

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#f59e0b' },
  contacted: { label: '已联系', color: '#3b82f6' },
  quoted: { label: '已报价', color: '#10b981' },
  closed: { label: '已成交', color: '#6b7280' },
  cancelled: { label: '已取消', color: '#ef4444' },
}

export default function InquiriesPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  // 页面每次显示时刷新数据
  useDidShow(() => {
    loadOrders()
  })

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await api.inquiry.list()
      setOrders(res.data || [])
    } catch (e: any) {
      showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="page-inquiries">
      {loading ? (
        <View className="loading"><Text className="text-gray-400">加载中...</Text></View>
      ) : orders.length === 0 ? (
        <View className="empty"><Text className="text-gray-400">暂无询价记录</Text></View>
      ) : (
        orders.map(order => (
          <View key={order.id} className="order-card">
            <View className="order-header">
              <Text className="order-no">{order.order_no}</Text>
              <View className="order-status" style={{ background: statusMap[order.status]?.color + '20' }}>
                <Text className="status-text" style={{ color: statusMap[order.status]?.color }}>
                  {statusMap[order.status]?.label || order.status}
                </Text>
              </View>
            </View>
            <View className="order-items">
              {(order.items || []).map((item: any, idx: number) => (
                <View key={idx} className="item-row">
                  <Text className="item-name">{item.name}</Text>
                  {item.type === 'doll' && (
                    <>
                      <Text className="item-qty">×{item.quantity || 1}</Text>
                      {item.boxSize && (
                        <Text className="item-box">{item.boxSize === 'small' ? '小箱' : item.boxSize === 'medium' ? '中箱' : item.boxSize === 'large' ? '大箱' : item.boxSize}</Text>
                      )}
                      {item.defaultAccessory && (
                        <Text className="item-acc">默认配饰: {item.defaultAccessory}</Text>
                      )}
                      {item.accessories && item.accessories.length > 0 && (
                        <Text className="item-acc">搭配配饰: {item.accessories.map((acc: any) => acc.name).join(' + ')}</Text>
                      )}
                      <Text className="item-price">¥{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</Text>
                    </>
                  )}
                  {item.type === 'accessory' && (
                    <>
                      <Text className="item-qty">×{item.quantity || 1}</Text>
                      <Text className="item-price">¥{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</Text>
                    </>
                  )}
                  {item.type === 'outfit' && (
                    <>
                      <Text className="item-qty">×{item.quantity || 1}</Text>
                      {item.defaultAccessories && item.defaultAccessories.length > 0 && (
                        <Text className="item-acc">搭配配饰: {item.defaultAccessories.map((acc: any) => acc.name).join(' + ')}</Text>
                      )}
                      <Text className="item-price">¥{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
            <View className="order-footer">
              <Text className="order-date">{order.createdAt}</Text>
              <Text className="order-amount">¥{order.totalAmount}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  )
}
