import { useState, useRef, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import { navigateBack, reLaunch, showToast } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

function getPersistentOpenid(): string {
  let openid = wx.getStorageSync('mini_openid')
  if (!openid) {
    openid = 'mini_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    wx.setStorageSync('mini_openid', openid)
  }
  return openid
}

export default function LoginPage() {
  const { setUserInfo, companyName } = useGlobalState()
  const [btnLoading, setBtnLoading] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 微信新版手机号授权（唯一正确写法）
  const handleWechatLogin = async (e: any) => {
    if (!isMountedRef.current) return

    console.log('[LOGIN] 授权回调:', e.detail)

    // 新版微信只认 code，有 code 就是授权成功
    const { code } = e.detail
    if (!code) {
      showToast({ title: '请允许获取手机号授权', icon: 'none' })
      return
    }

    const openid = getPersistentOpenid()
    setBtnLoading(true)

    try {
      const res = await api.auth.login({
        openid: openid,
        nickname: '微信用户',
        avatar: '',
        code: code,
      })

      if (res.code === 200 && res.data?.id) {
        setUserInfo(res.data)
        wx.setStorageSync('mini_user_id', res.data.id)
        wx.setStorageSync('mini_user_info', JSON.stringify(res.data))
        wx.setStorageSync('mini_token', res.data.token || res.data.id)
        showToast({ title: '登录成功', icon: 'success' })
        if (isMountedRef.current) {
          setTimeout(() => reLaunch({ url: '/pages/profile/index' }), 1000)
        }
      } else {
        showToast({ title: res.msg || '登录失败', icon: 'none' })
      }
    } catch (err: any) {
      if (!isMountedRef.current) return
      showToast({ title: err.message || '登录失败', icon: 'none' })
      return
    } finally {
      if (isMountedRef.current) {
        setBtnLoading(false)
      }
    }
  }

  return (
    <View className="page-login">
      <View className="login-header">
        <Text className="header-title">登录</Text>
        <Text className="header-subtitle">欢迎来到{companyName}</Text>
      </View>

      <View className="login-content">
        <View className="login-section">
          <Text className="section-title">微信授权登录</Text>
          <Button
            className="wechat-btn"
            open-type="getPhoneNumber"
            onGetPhoneNumber={handleWechatLogin}
            loading={btnLoading}
          >
            <Text className="wechat-btn-text">微信授权登录</Text>
          </Button>
          <Text className="login-tip">点击上方按钮获取手机号授权</Text>
        </View>
      </View>

      <View className="login-footer" onClick={() => navigateBack()}>
        <Text className="back-btn">返回</Text>
      </View>
    </View>
  )
}