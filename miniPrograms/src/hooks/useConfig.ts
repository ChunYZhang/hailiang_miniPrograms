import { useEffect, useRef } from 'react'
import { setNavigationBarTitle } from '@tarojs/taro'
import { useGlobalState } from '../store'
import { api } from '../services/api'

/**
 * 从后端加载公司配置信息（公司名称等）
 * 启动时调用一次，之后从缓存读取
 */
export function useConfig() {
  const { setCompanyName, companyName } = useGlobalState()
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    // 启动时先检查缓存，有则直接使用
    const cachedName = wx.getStorageSync('company_name')
    if (cachedName) {
      setCompanyName(cachedName)
      setNavigationBarTitle({ title: cachedName })
      return
    }

    // 无缓存则从后端获取
    api.company.info().then((res: any) => {
      if (res?.data?.name) {
        setCompanyName(res.data.name)
        setNavigationBarTitle({ title: res.data.name })
      }
    }).catch(() => {})
  }, [setCompanyName])

  return { companyName }
}
