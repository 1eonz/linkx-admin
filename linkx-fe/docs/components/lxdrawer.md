# LxDrawer 详情抽屉

右侧滑出详情容器：默认 **480px**（设计稿明确），标题左侧圆形图标块，footer 左提示右按钮。

<script setup lang="ts">
import Basic from '../../src/components/LxDrawer/demo/basic.vue';
</script>

## 基础用法

<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxDrawer/demo/basic.vue
:::

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model | 显隐 | `boolean` | `false` |
| title | 标题（12px 加粗） | `string` | — |
| icon | 标题左侧圆形图标块 | `LxIconName` | — |
| size | 宽度 | `number \| string` | `480` |
| close-on-click-modal | 点遮罩关闭 | `boolean` | `false` |

### Slots

- `default`：内容区（标签-值两端对齐的描述行由业务排布）。
- `footer`：底部区（左侧提示文字 + 右侧按钮组）。

## 使用铁律

- **详情一律走抽屉不走弹窗**（设计稿明确）：客户端详情、审计详情、节点详情场景。
- 内容分组多时配 SectionTitle 分区块；键值对展示建议两端对齐行。
