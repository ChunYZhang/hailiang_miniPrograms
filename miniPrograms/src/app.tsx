import { View } from '@tarojs/components'
import { GlobalProvider } from './store'
import { useConfig } from './hooks/useConfig'
import PindanBar from './components/PindanBar'
import './styles/index.scss'

function ConfigLoader() {
  // 启动时从后端加载公司配置并缓存
  useConfig()
  return null
}

export default function App({ children }: any) {
  return (
    <GlobalProvider>
      <ConfigLoader />
      <View className="app">{children}</View>
      <PindanBar />
    </GlobalProvider>
  )
}

