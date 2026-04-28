import { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { navigateTo, showToast, showModal } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

export default function AddressListPage() {
  const { userInfo } = useGlobalState()
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadAddresses = async () => {
    if (!userInfo) {
      showToast({ title: '请先登录', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await api.address.list()
      setAddresses(res.data || [])
    } catch (e) {
      console.error('加载地址失败', e)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    loadAddresses()
  })

  useEffect(() => {
    if (userInfo) loadAddresses()
  }, [userInfo])

  const handleDelete = async (id: string) => {
    try {
      await api.address.delete(id)
      showToast({ title: '删除成功', icon: 'success' })
      loadAddresses()
    } catch (e: any) {
      showToast({ title: e.message || '删除失败', icon: 'none' })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await api.address.setDefault(id)
      showToast({ title: '设置成功', icon: 'success' })
      loadAddresses()
    } catch (e: any) {
      showToast({ title: e.message || '设置失败', icon: 'none' })
    }
  }

  return (
    <View className="page-address-list">
      <View className="address-list">
        {loading ? (
          <View className="loading-tip"><Text className="text-gray-400">加载中...</Text></View>
        ) : addresses.length === 0 ? (
          <View className="empty-tip">
            <Text className="empty-icon">📦</Text>
            <Text className="empty-text">暂无收货地址</Text>
            <Text className="empty-hint">点击下方按钮添加</Text>
          </View>
        ) : (
          addresses.map(addr => (
            <View key={addr.id} className="address-card" onClick={() => navigateTo({ url: `/pages/address/edit?id=${addr.id}` })}>
              {addr.is_default == 1 && (
                <View className="default-badge">
                  <Text className="badge-text">默认</Text>
                </View>
              )}
              <View className="card-main">
                <View className="contact-row">
                  <Text className="contact-name">{addr.name}</Text>
                  <Text className="contact-phone">{addr.phone}</Text>
                </View>
                <Text className="address-text">
                  {addr.province} {addr.city} {addr.district} {addr.detail}
                </Text>
              </View>
              <View className="card-actions">
                <View
                  className="action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation?.()
                    navigateTo({ url: `/pages/address/edit?id=${addr.id}` })
                  }}
                >
                  <Text className="action-text">编辑</Text>
                </View>
                {addr.is_default != 1 && (
                  <View
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation?.()
                      handleSetDefault(addr.id)
                    }}
                  >
                    <Text className="action-text gray">设为默认</Text>
                  </View>
                )}
                <View
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation?.()
                    showModal({
                      title: '确认删除',
                      content: '确定要删除该地址吗？',
                      success: (res) => {
                        if (res.confirm) handleDelete(addr.id)
                      }
                    })
                  }}
                >
                  <Text className="action-text red">删除</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View className="bottom-bar">
        <Button className="add-btn" onClick={() => navigateTo({ url: '/pages/address/edit' })}>
          <Text className="btn-icon">+</Text>
          <Text className="btn-text">新增收货地址</Text>
        </Button>
      </View>
    </View>
  )
}