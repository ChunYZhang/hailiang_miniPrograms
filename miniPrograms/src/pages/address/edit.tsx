import { useState, useEffect } from 'react'
import { View, Text, Input, Button, Picker } from '@tarojs/components'
import { navigateBack, showToast } from '@tarojs/taro'
import { api } from '../../services/api'
import './edit.scss'

export default function AddressEditPage() {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [region, setRegion] = useState<number[]>([0, 0, 0])
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [detail, setDetail] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any).options || {}
    if (options.id) {
      setId(options.id)
      loadAddress(options.id)
    }
  }, [])

  const loadAddress = async (addressId: string) => {
    try {
      const res = await api.address.list()
      const addr = (res.data || []).find((a: any) => a.id === addressId)
      if (addr) {
        setName(addr.name)
        setPhone(addr.phone)
        setProvince(addr.province)
        setCity(addr.city)
        setDistrict(addr.district || '')
        setDetail(addr.detail)
        setIsDefault(addr.is_default == 1)
      }
    } catch (e) {
      console.error('加载地址失败', e)
    }
  }

  const handleRegionChange = (e: any) => {
    const selected = e.detail.value
    setRegion(selected)
    setProvince(selected[0] || '')
    setCity(selected[1] || '')
    setDistrict(selected[2] || '')
  }

  const handleSave = async () => {
    if (!name.trim()) {
      showToast({ title: '请输入收货人', icon: 'none' })
      return
    }
    if (!phone.trim() || !/^1\d{10}$/.test(phone)) {
      showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!province || !city) {
      showToast({ title: '请选择省市区', icon: 'none' })
      return
    }
    if (!detail.trim()) {
      showToast({ title: '请输入详细地址', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        phone: phone.trim(),
        province,
        city,
        district,
        detail: detail.trim(),
        is_default: isDefault ? 1 : 0,
      }
      if (id) {
        data.id = id
        await api.address.update(data)
      } else {
        await api.address.create(data)
      }
      showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => navigateBack(), 1000)
    } catch (err: any) {
      showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const addressText = province ? `${province} ${city} ${district}` : ''

  return (
    <View className="page-address-edit">
      <View className="edit-content">
        <View className="edit-item">
          <Text className="item-label">收货人</Text>
          <Input
            className="item-input"
            placeholder="请输入收货人姓名"
            value={name}
            onInput={(e: any) => setName(e.detail.value)}
          />
        </View>

        <View className="edit-item">
          <Text className="item-label">手机号</Text>
          <Input
            className="item-input"
            type="number"
            maxlength={11}
            placeholder="请输入手机号"
            value={phone}
            onInput={(e: any) => setPhone(e.detail.value)}
          />
        </View>

        <View className="edit-item">
          <Text className="item-label">地区</Text>
          <Picker mode="region" value={region} onChange={handleRegionChange}>
            <View className="picker-value">
              <Text className={province ? 'value-text' : 'placeholder-text'}>
                {province ? addressText : '请选择省市区'}
              </Text>
              <Text className="arrow">›</Text>
            </View>
          </Picker>
        </View>

        <View className="edit-item detail-item">
          <Text className="item-label">详细地址</Text>
          <Input
            className="item-input detail-input"
            placeholder="街道、门牌号等"
            value={detail}
            onInput={(e: any) => setDetail(e.detail.value)}
          />
        </View>

        <View className="edit-item switch-item">
          <Text className="item-label">设为默认</Text>
          <View
            className={`switch ${isDefault ? 'on' : ''}`}
            onClick={() => setIsDefault(!isDefault)}
          >
            <View className="switch-btn" />
          </View>
        </View>
      </View>

      <View className="btn-wrap">
        <Button className="save-btn" loading={saving} onClick={handleSave}>
          <Text className="text-white">保存</Text>
        </Button>
      </View>
    </View>
  )
}
