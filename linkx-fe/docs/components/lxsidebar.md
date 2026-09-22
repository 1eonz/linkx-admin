# LxSidebar 侧边栏

双形态导航容器：`expanded`（252px 完整导航）/ `rail`（64px 图标轨道，hover 弹出二级 popper）。视觉源为 stitch 设计稿唯一基准，HUD 战术风格（激活竖条发光、品牌同心环呼吸）。

## 基础用法

<script setup>
import Basic from '../../src/components/LxSidebar/demo/basic.vue';
import Controlled from '../../src/components/LxSidebar/demo/controlled.vue';
</script>
<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxSidebar/demo/basic.vue
:::

## 双形态受控切换（v-model:mode + 持久化）

<div class="demo-box"><Controlled /></div>

::: details 查看代码
<<< ../../src/components/LxSidebar/demo/controlled.vue
:::

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| mode / v-model:mode | 形态 | `'rail' \| 'expanded'` | `expanded` |
| items | 菜单树（key/title/icon/children/badge/badgeType/disabled/meta） | `LxMenuItem[]` | `[]` |
| active-key | 激活项 key（建议绑定 route.name） | `string` | `''` |
| title / subtitle | 品牌标题 / 副标题 | `string` | `警务业务协同平台` |
| mobile | 移动端抽屉模式（v-model:mobile） | `boolean` | `false` |
| show-footer | 底部状态区（SLA 仪表 + 节点徽章 + 切换按钮） | `boolean` | `true` |
| sla-value | SLA 仪表数值 | `number` | `99.9` |
| node-label / node-status | 节点徽章文案 / 状态 | `string` / `LxStatus` | `NODE-01` / `online` |

### Events

| 名称 | 说明 | 回调 |
|---|---|---|
| select | 菜单项选中（直达项与二级项统一出口） | `(item: LxMenuItem)` |
| expand-change | 分组展开状态变化 | `(keys: string[])` |
| update:mode / update:mobile | 受控更新 | — |

### Slots

`brand`（品牌区）/ `append`（菜单追加区）/ `footer`（底部状态区）

## FAQ

**如何接 router？** 监听 `@select`，对无 `children` 的项 `router.push(item.path)`；`activeKey` 绑定 `route.name`。
