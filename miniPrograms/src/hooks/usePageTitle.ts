import { useEffect } from 'react'
import Taro from '@tarojs/taro'

/**
 * 动态设置当前页面导航栏标题
 * 在页面组件顶层调用即可，无需手动写 useEffect
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    Taro.setNavigationBarTitle({ title }).catch(() => {})
  }, [title])
}
