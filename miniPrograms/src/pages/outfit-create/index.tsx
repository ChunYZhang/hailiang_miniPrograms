import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Input, Button } from '@tarojs/components'
import { showToast, navigateBack } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

export default function OutfitCreatePage() {
  const { userInfo } = useGlobalState()
  const [name, setName] = useState('')
  const [dolls, setDolls] = useState<any[]>([])
  const [selectedDoll, setSelectedDoll] = useState<any>(null)
  const [accessories, setAccessories] = useState<any[]>([])
  const [selectedAccs, setSelectedAccs] = useState<any[]>([])
  const [coverImage, setCoverImage] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadDolls()
    loadAccessories()
    loadCategories()
  }, [])

  const loadDolls = async () => {
    try {
      const res = await api.doll.list({ page_size: 100 })
      setDolls(res.data || [])
    } catch (e) {}
  }

  const loadAccessories = async () => {
    try {
      const res = await api.accessory.list({ page_size: 100 })
      setAccessories(res.data || [])
    } catch (e) {}
  }

  const loadCategories = async () => {
    try {
      const res = await api.outfit.categories()
      setCategories(res.data || [])
      if (res.data?.length > 0) setActiveCategory(res.data[0].id)
    } catch (e) {}
  }

  const totalPrice = (selectedDoll?.price || 0) + selectedAccs.reduce((s, a) => s + (a.price || 0), 0)

  const toggleAcc = (acc: any) => {
    setSelectedAccs(prev => {
      const idx = prev.findIndex(a => a.id === acc.id)
      if (idx > -1) return prev.filter(a => a.id !== acc.id)
      return [...prev, acc]
    })
  }

  const handleSave = async () => {
    if (!name.trim()) { showToast({ title: '请输入方案名称', icon: 'none' }); return }
    if (!activeCategory) { showToast({ title: '请先在搭配方案页面创建分类', icon: 'none' }); return }
    setSaving(true)
    try {
      await api.outfit.saveOutfit({
        category_id: activeCategory,
        name: name.trim(),
        doll_id: selectedDoll?.id || '',
        doll_name: selectedDoll?.name || '',
        accessories: selectedAccs.map(a => ({ id: a.id, name: a.name, price: a.price })),
        total_price: totalPrice,
        cover_image: coverImage || selectedDoll?.images?.[0] || '',
      })
      showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => navigateBack(), 1500)
    } catch (e: any) {
      showToast({ title: e.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className="page-create">
      <View className="form-section">
        <Text className="form-label">方案名称</Text>
        <Input
          className="form-input"
          placeholder="输入搭配方案名称"
          value={name}
          onInput={e => setName(e.detail.value)}
        />
      </View>

      {categories.length > 0 && (
        <View className="form-section">
          <Text className="form-label">所属分类</Text>
          <ScrollView className="cat-scroll" scrollX>
            {categories.map(c => (
              <View
                key={c.id}
                className={`filter-tag ${activeCategory === c.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(c.id)}
              >
                {c.name}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="form-section">
        <Text className="form-label">选择娃娃（可选）</Text>
        <ScrollView className="item-scroll" scrollX>
          {dolls.map(d => (
            <View
              key={d.id}
              className={`select-card ${selectedDoll?.id === d.id ? 'selected' : ''}`}
              onClick={() => setSelectedDoll(selectedDoll?.id === d.id ? null : d)}
            >
              <Image className="select-image" src={d.coverImage || d.images?.[0] || 'https://picsum.photos/80/80'} mode="aspectFill" />
              <Text className="select-name">{d.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="form-section">
        <Text className="form-label">选择配饰</Text>
        <View className="acc-grid">
          {accessories.map(acc => (
            <View
              key={acc.id}
              className={`acc-card ${selectedAccs.find(a => a.id === acc.id) ? 'selected' : ''}`}
              onClick={() => toggleAcc(acc)}
            >
              <Image className="acc-image" src={acc.coverImage || acc.images?.[0] || 'https://picsum.photos/80/80'} mode="aspectFill" />
              <Text className="acc-name">{acc.name}</Text>
              <Text className="acc-price">¥{acc.price}</Text>
              {selectedAccs.find(a => a.id === acc.id) && (
                <View className="check-badge"><Text className="text-white text-xs">✓</Text></View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View className="total-bar">
        <Text className="total-label">预估总价</Text>
        <Text className="total-price">¥{totalPrice}</Text>
        <Button className="save-btn" loading={saving} onClick={handleSave}>保存方案</Button>
      </View>
    </View>
  )
}
