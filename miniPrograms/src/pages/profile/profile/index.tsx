import { useState, useEffect } from 'react'
import { View, Text, Image, Button, Input, Picker } from '@tarojs/components'
import { navigateBack, showToast } from '@tarojs/taro'
import { api } from '../../../services/api'
import { useGlobalState } from '../../../store'
import './index.scss'

export default function ProfileEditPage() {
  const { userInfo, setUserInfo } = useGlobalState()
  const [nickname, setNickname] = useState(userInfo?.nickname || '')
  const [avatar, setAvatar] = useState(userInfo?.avatar || '')
  const [phone, setPhone] = useState(userInfo?.phone || '')
  const [region, setRegion] = useState<number[]>([0, 0, 0])
  const [regionStr, setRegionStr] = useState(userInfo?.region || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userInfo) {
      setNickname(userInfo.nickname || '')
      setAvatar(userInfo.avatar || '')
      setPhone(userInfo.phone || '')
      if (userInfo.region) {
        setRegionStr(userInfo.region)
      }
    }
  }, [userInfo])

  const handleChooseAvatar = (e: any) => {
    const url = e.detail.avatarUrl
    if (url) {
      setAvatar(url)
    }
  }

  const handleRegionChange = (e: any) => {
    const selected = e.detail.value
    setRegion(selected)
    setRegionStr(selected[0] + ' ' + selected[1] + ' ' + selected[2])
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      const res = await api.auth.updateProfile({
        nickname: nickname.trim(),
        avatar: avatar,
        phone: phone.trim(),
        region: regionStr,
      })

      if (res.code === 200) {
        const newUserInfo = {
          ...userInfo!,
          nickname: nickname.trim(),
          avatar: avatar,
          phone: phone.trim(),
          region: regionStr,
        }
        setUserInfo(newUserInfo)
        wx.setStorageSync('mini_user_info', JSON.stringify(newUserInfo))
        showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => navigateBack(), 1000)
      } else {
        showToast({ title: res.msg || '保存失败', icon: 'none' })
      }
    } catch (err: any) {
      showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className="page-edit">
      <View className="edit-header">
        <Button className="save-btn" loading={saving} onClick={handleSave}>
          <Text className="text-white">保存</Text>
        </Button>
      </View>

      <View className="edit-content">
        <View className="edit-item">
          <Text className="item-label">头像</Text>
          <Button className="avatar-btn" open-type="chooseAvatar" onChooseAvatar={handleChooseAvatar}>
            {avatar ? (
              <Image src={avatar} className="avatar-img" mode="aspectFill" />
            ) : (
              <View className="avatar-placeholder">
                <Text className="text-gray-400">点击选择</Text>
              </View>
            )}
          </Button>
        </View>

        <View className="edit-item">
          <Text className="item-label">昵称</Text>
          <Input
            type="nickname"
            className="nickname-input"
            placeholder="点击输入昵称"
            value={nickname}
            onInput={(e: any) => setNickname(e.detail.value)}
          />
        </View>

        <View className="edit-item">
          <Text className="item-label">手机号</Text>
          <Input
            type="number"
            maxlength={11}
            className="nickname-input"
            placeholder="请输入手机号"
            value={phone}
            onInput={(e: any) => setPhone(e.detail.value)}
          />
        </View>

        <View className="edit-item">
          <Text className="item-label">地区</Text>
          <Picker mode="region" value={region} onChange={handleRegionChange}>
            <View className="picker-value">
              {regionStr || '请选择省市区'}
            </View>
          </Picker>
        </View>
      </View>
    </View>
  )
}