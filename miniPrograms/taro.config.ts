import type { AppConfig } from '@tarojs/taro'

const config: AppConfig = {
  projectName: 'hailiang-mini',
  date: new Date().toISOString(),
  designWidth: 375,
  deviceRatio: {
    375: 1 / 2,
    640: 1 / 2.5,
    750: 1 / 2,
    828: 1 / 2.6,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  mini: {
    compile: {
      exclude: [],
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: {
          limit: 1024,
        },
      },
      cssModules: {
        enable: false,
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
      },
    },
  },
}

module.exports = config
