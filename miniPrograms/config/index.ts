import type { IConfig } from '@tarojs/taro'

const config: IConfig = {
  projectName: 'hailiang-mini',
  date: new Date().toISOString(),
  designWidth: 375,
  deviceRatio: {
    375: 2,
    640: 2.5,
    750: 2,
    828: 2.6,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    '@tarojs/plugin-platform-weapp',
  ],
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  mini: {
    compile: {
      exclude: [],
    },
  },
}

module.exports = config
