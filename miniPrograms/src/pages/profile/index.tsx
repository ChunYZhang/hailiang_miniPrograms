import { useState, useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import { navigateTo, showToast } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

export default function ProfilePage() {
  const { userInfo, setUserInfo } = useGlobalState()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (userInfo) loadProfile()
  }, [userInfo])

  const loadProfile = async () => {
    try {
      const res = await api.auth.profile()
      setProfile(res.data)
    } catch (e) {}
  }

  const handleLogout = async () => {
    try {
      await api.auth.logout()
    } catch (e) {}
    setUserInfo(null)
    setProfile(null)
    showToast({ title: '已退出登录', icon: 'success' })
  }

  // 未登录状态 - 显示登录模板，点击昵称触发登录
  if (!userInfo) {
    return (
      <View className="page-profile">
        <View className="profile-header">
          <Image
            className="avatar"
            src="https://picsum.photos/80/80"
            mode="aspectFill"
          />
          <View className="profile-info">
            <Text className="nickname-text" onClick={() => navigateTo({ url: '/pages/login/index' })}>点击登录</Text>
          </View>
        </View>

        <View className="menu-list">
          <View className="menu-item" onClick={() => showToast({ title: '请先登录', icon: 'none' })}>
            <Text className="menu-icon">❤️</Text>
            <Text className="menu-text">我的收藏</Text>
            <Text className="menu-arrow">›</Text>
          </View>
          <View className="menu-item" onClick={() => showToast({ title: '请先登录', icon: 'none' })}>
            <Text className="menu-icon">🕐</Text>
            <Text className="menu-text">浏览历史</Text>
            <Text className="menu-arrow">›</Text>
          </View>
          <View className="menu-item" onClick={() => showToast({ title: '请先登录', icon: 'none' })}>
            <Text className="menu-icon">📋</Text>
            <Text className="menu-text">我的询价</Text>
            <Text className="menu-arrow">›</Text>
          </View>
          </View>
      </View>
    )
  }

  // 已登录状态
  return (
    <View className="page-profile">
      <View className="profile-header" onClick={() => navigateTo({ url: '/pages/profile/profile/index' })}>
        <Image
          className="avatar"
          src={profile?.avatar || userInfo?.avatar || 'https://picsum.photos/80/80'}
          mode="aspectFill"
        />
        <View className="profile-info">
          <Text className="nickname">{profile?.nickname || userInfo?.nickname || '点击编辑昵称'}</Text>
          <Text className="phone">{userInfo?.phone || profile?.phone || '未绑定手机'}</Text>
        </View>
      </View>

      <View className="menu-list">
        <View className="menu-item" onClick={() => navigateTo({ url: '/pages/profile/favorites/index' })}>
          <Text className="menu-icon">❤️</Text>
          <Text className="menu-text">我的收藏</Text>
          <Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item" onClick={() => navigateTo({ url: '/pages/profile/history/index' })}>
          <Text className="menu-icon">🕐</Text>
          <Text className="menu-text">浏览历史</Text>
          <Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item" onClick={() => navigateTo({ url: '/pages/profile/inquiries/index' })}>
          <Text className="menu-icon">📋</Text>
          <Text className="menu-text">我的询价</Text>
          <Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item" onClick={() => navigateTo({ url: '/pages/address/index' })}>
          <Text className="menu-icon">📍</Text>
          <Text className="menu-text">收货地址</Text>
          <Text className="menu-arrow">›</Text>
        </View>
      </View>

      <View className="logout-section">
        <Button className="logout-btn" onClick={handleLogout}>退出登录</Button>
      </View>
    </View>
  )
}