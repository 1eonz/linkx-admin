import DefaultTheme from 'vitepress/theme'
import { defineComponent, h } from 'vue'
import ElementPlus, {
  ID_INJECTION_KEY,
  ZINDEX_INJECTION_KEY,
} from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '../../../src/tokens/variables.css'
import '../../../src/tokens/theme-hud.css'
import LxUI from '../../../src'
import './custom.css'
import { useResponsiveDocTable } from './useResponsiveDocTable'

/** 为文档页挂载 API 表格的窄屏提示、键盘滚动和无障碍关联。 */
const Layout = defineComponent({
  name: 'LxDocsLayout',
  setup(_, { attrs, slots }) {
    useResponsiveDocTable()

    return () => h(DefaultTheme.Layout, attrs, slots)
  },
})

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.use(ElementPlus)
    app.use(LxUI)
    // SSR 渲染（vitepress build）必须显式注入，否则 EP 组件报 IdInjection/ZIndexInjection
    // 固定 prefix 保证 SSR 输出与客户端 hydration 的 id 一致
    app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 })
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
  },
}
