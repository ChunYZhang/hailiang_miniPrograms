import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { navigateTo, showModal, showToast, useDidShow } from '@tarojs/taro'
import { api } from '../../services/api'
import { useGlobalState } from '../../store'
import './index.scss'

export default function OutfitListPage() {
  const { userInfo } = useGlobalState()
  const [sysOutfits, setSysOutfits] = useState<any[]>([])
  const [userCategories, setUserCategories] = useState<any[]>([])
  const [userOutfits, setUserOutfits] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'system' | 'custom'>('system')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [outfitRes, catRes] = await Promise.all([
        api.outfit.list(),
        api.outfit.categories(),
      ])
      setSysOutfits(outfitRes.data || [])
      setUserCategories(catRes.data || [])
      if (catRes.data?.length > 0) {
        const outfitsRes = await api.outfit.userList({ category_id: catRes.data[0].id })
        setUserOutfits(outfitsRes.data || [])
      }
    } catch (e) {
      console.error('加载数据失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useDidShow(() => {
    loadData()
  })

  const handleCategoryChange = async (categoryId: string) => {
    try {
      const res = await api.outfit.userList({ category_id: categoryId })
      setUserOutfits(res.data || [])
    } catch (e) {
      console.error('加载失败', e)
    }
  }

  const handleAddCategory = async () => {
    if (!userInfo) { showToast({ title: '请先登录', icon: 'none' }); return }
    const res = await showModal({ title: '新建分类', editable: true, placeholderText: '输入分类名称' })
    if (res.confirm && res.content?.trim()) {
      try {
        await api.outfit.createCategory({ name: res.content.trim() })
        showToast({ title: '创建成功', icon: 'success' })
        loadData()
      } catch (e: any) {
        showToast({ title: e.message || '创建失败', icon: 'none' })
      }
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const res = await showModal({ title: '确认删除该分类？' })
    if (res.confirm) {
      try {
        await api.outfit.deleteCategory(id)
        showToast({ title: '已删除', icon: 'success' })
        loadData()
      } catch (e: any) {
        showToast({ title: e.message || '删除失败', icon: 'none' })
      }
    }
  }

  const outfits = activeTab === 'system' ? sysOutfits : userOutfits

  return (
    <View className="page-outfit-list">
      {/* Tab 切换 */}
      <View className="tab-bar">
        <View
          className={`tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          默认搭配
        </View>
        <View
          className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          我的搭配
        </View>
      </View>

      {activeTab === 'system' ? (
        <View className="outfit-grid">
          {loading ? (
            <View className="loading-tip"><Text className="text-gray-400">加载中...</Text></View>
          ) : sysOutfits.length === 0 ? (
            <View className="empty-tip"><Text className="text-gray-400 text-sm">暂无搭配方案</Text></View>
          ) : (
            sysOutfits.map(outfit => (
              <View
                key={outfit.id}
                className="outfit-card"
                onClick={() => navigateTo({ url: `/pages/outfit-detail/index?id=${outfit.id}&type=system` })}
              >
                <Image className="outfit-cover" src={outfit.cover_image || 'https://picsum.photos/200/200'} mode="aspectFill" />
                <View className="outfit-info">
                  <Text className="outfit-name">{outfit.name}</Text>
                  <Text className="outfit-price">¥{outfit.total_price}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      ) : (
        <>
          {/* 用户分类标签 */}
          <ScrollView className="cat-scroll" scrollX>
            <View
              className="cat-add-btn"
              onClick={handleAddCategory}
            >
              <Text className="text-lg text-gray-400">+</Text>
            </View>
            {userCategories.map(cat => (
              <View key={cat.id} className="cat-tag-wrap" onLongPress={() => handleDeleteCategory(cat.id)}>
                <View
                  className="cat-tag"
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <Text className="cat-name">{cat.name}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View className="outfit-grid">
            {userOutfits.length === 0 ? (
              <View className="empty-tip">
                <Text className="text-gray-400 text-sm">该分类下暂无搭配，试试创建</Text>
                <View
                  className="create-btn"
                  onClick={() => navigateTo({ url: '/pages/outfit-create/index' })}
                >
                  <Text className="text-white text-sm">创建搭配方案</Text>
                </View>
              </View>
            ) : (
              userOutfits.map(outfit => (
                <View
                  key={outfit.id}
                  className="outfit-card"
                  onClick={() => navigateTo({ url: `/pages/outfit-detail/index?id=${outfit.id}&type=custom` })}
                >
                  <Image className="outfit-cover" src={outfit.cover_image || 'https://picsum.photos/200/200'} mode="aspectFill" />
                  <View className="outfit-info">
                    <Text className="outfit-name">{outfit.name}</Text>
                    <Text className="outfit-price">¥{outfit.total_price}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </View>
  )
}
