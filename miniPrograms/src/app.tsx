import { View } from '@tarojs/components'
import { GlobalProvider } from './store'
import PindanBar from './components/PindanBar'
import './styles/index.scss'

export default function App({ children }: any) {
  return (
    <GlobalProvider>
      <View className="app">{children}</View>
      <PindanBar />
    </GlobalProvider>
  )
}
