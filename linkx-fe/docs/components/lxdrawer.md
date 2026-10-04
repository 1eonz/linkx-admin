# LxDrawer 详情抽屉

右侧滑出详情容器：默认 **480px**（设计稿明确），标题左侧圆形图标块，footer 左提示右按钮。

<script setup lang="ts">
import Basic from '../../src/components/LxDrawer/demo/basic.vue';
</script>

## 基础用法

<div class="demo-box"><Basic /></div>

示例覆盖 HUD 主题切换、受控打开/关闭、footer 操作、危险确认和窄屏按钮换行；不请求后端。

::: details 查看代码
<<< ../../src/components/LxDrawer/demo/basic.vue
:::

## API

### Props

| 名称                 | 说明               | 类型               | 默认值  |
| -------------------- | ------------------ | ------------------ | ------- |
| v-model              | 显隐               | `boolean`          | `false` |
| title                | 标题（12px 加粗）  | `string`           | —       |
| icon                 | 标题左侧圆形图标块 | `LxIconName`       | —       |
| size                 | 宽度               | `number \| string` | `480`   |
| close-on-click-modal | 点遮罩关闭         | `boolean`          | `false` |
| close-on-press-esc   | 按 `Escape` 关闭   | `boolean`          | `true`  |

### Events

| 名称                | 说明                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| `update:modelValue` | 抽屉由关闭按钮、允许的遮罩或 ESC 关闭时更新为 `false`；外部打开时也可同步 `true`。 |

### Slots

- `default`：内容区（标签-值两端对齐的描述行由业务排布）。
- `footer`：底部区（左侧提示文字 + 右侧按钮组）。

`close-on-click-modal` 默认是 `false` 以防误触，`close-on-press-esc` 默认是 `true` 以提供键盘退出路径；有未保存数据的场景由宿主显式传 `false` 并提供确认流程。标题会通过 `aria-labelledby` 关联；无标题时使用“详情抽屉”作为可访问名称。数字 `size` 会以 `min(px, 100vw)` 约束，避免窄屏横向溢出。portal 浮层跟随 `html.lx-theme-hud` 根主题。

## 使用铁律

- **详情一律走抽屉不走弹窗**（设计稿明确）：客户端详情、审计详情、节点详情场景。
- 内容分组多时配 SectionTitle 分区块；键值对展示建议两端对齐行。
