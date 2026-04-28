import { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { api } from '../../services/api'
import './index.scss'

interface CompanyInfo {
  name: string
  slogan: string
  phone: string
  address: string
  workHours: string
  email: string
  description: string
}

interface Certificate {
  id: string
  name: string
  image: string
}

export default function CompanyPage() {
  const [info, setInfo] = useState<CompanyInfo | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  // 每次页面显示时刷新数据
  useDidShow(() => {
    loadData()
  })

  const loadData = async () => {
    try {
      const [infoRes, certRes] = await Promise.all([
        api.company.info(),
        api.company.certificates(),
      ])
      setInfo(infoRes.data || null)
      setCertificates(certRes.data || [])
    } catch (e) {
      console.error('加载企业信息失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCall = () => {
    if (info?.phone) {
      wx.makePhoneCall({ phoneNumber: info.phone })
    }
  }

  if (loading) {
    return (
      <View className="page-loading">
        <Text className="loading-text">加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className="page-company">
      {/* 企业头部 */}
      <View className="company-header">
        <View className="company-logo">🏢</View>
        <View className="company-info">
          <Text className="company-name">{info?.name || '海亮布娃娃'}</Text>
          {info?.slogan && <Text className="company-slogan">{info.slogan}</Text>}
        </View>
      </View>

      {/* 联系方式 */}
      <View className="contact-section">
        <View className="section-title-row">
          <Text className="section-title">联系方式</Text>
        </View>
        <View className="contact-card">
          {info?.phone && (
            <View className="contact-item" onClick={handleCall}>
              <View className="contact-icon-wrap">
                <Text className="contact-icon">📞</Text>
              </View>
              <View className="contact-content">
                <Text className="contact-label">联系电话</Text>
                <Text className="contact-value phone">{info.phone}</Text>
              </View>
              <Text className="contact-arrow">›</Text>
            </View>
          )}
          {info?.address && (
            <View className="contact-item">
              <View className="contact-icon-wrap">
                <Text className="contact-icon">📍</Text>
              </View>
              <View className="contact-content">
                <Text className="contact-label">公司地址</Text>
                <Text className="contact-value">{info.address}</Text>
              </View>
            </View>
          )}
          {info?.workHours && (
            <View className="contact-item">
              <View className="contact-icon-wrap">
                <Text className="contact-icon">🕐</Text>
              </View>
              <View className="contact-content">
                <Text className="contact-label">工作时间</Text>
                <Text className="contact-value">{info.workHours}</Text>
              </View>
            </View>
          )}
          {info?.email && (
            <View className="contact-item">
              <View className="contact-icon-wrap">
                <Text className="contact-icon">✉️</Text>
              </View>
              <View className="contact-content">
                <Text className="contact-label">电子邮箱</Text>
                <Text className="contact-value">{info.email}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 公司简介 */}
      {info?.description && (
        <View className="desc-section">
          <View className="section-title-row">
            <Text className="section-title">公司简介</Text>
          </View>
          <View className="desc-card">
            <Text className="desc-text">{info.description}</Text>
          </View>
        </View>
      )}

      {/* 资质证书 */}
      {certificates.length > 0 && (
        <View className="cert-section">
          <View className="section-title-row">
            <Text className="section-title">资质证书</Text>
            <Text className="section-count">共{certificates.length}张</Text>
          </View>
          <View className="cert-grid">
            {certificates.map(cert => (
              <View key={cert.id} className="cert-item">
                <Image
                  className="cert-image"
                  src={cert.image}
                  mode="aspectFill"
                  onClick={() => {
                    wx.previewImage({
                      urls: [cert.image],
                      current: cert.image,
                    })
                  }}
                />
                <Text className="cert-name">{cert.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="bottom-placeholder" />
    </ScrollView>
  )
}
