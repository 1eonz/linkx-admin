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

| 名称                     | 说明                                                                                           | 类型                   | 默认值               |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------- | -------------------- |
| mode / v-model:mode      | 形态                                                                                           | `'rail' \| 'expanded'` | `expanded`           |
| items                    | 菜单树（key/title/icon/children/badge/badgeType/disabled/meta）                                | `LxMenuItem[]`         | `[]`                 |
| active-key               | 激活项 key（建议绑定 route.name）                                                              | `string`               | `''`                 |
| title / subtitle         | 品牌标题 / 副标题                                                                              | `string`               | `警务业务协同平台`   |
| mobile                   | 移动端模态导航抽屉（v-model:mobile）；打开后焦点进入抽屉，Tab 在抽屉内循环，关闭后返回触发控件 | `boolean`              | `false`              |
| show-footer              | 底部状态区（SLA 仪表 + 节点徽章 + 切换按钮）                                                   | `boolean`              | `true`               |
| sla-value                | SLA 仪表数值                                                                                   | `number`               | `99.9`               |
| node-label / node-status | 节点徽章文案 / 状态                                                                            | `string` / `LxStatus`  | `NODE-01` / `online` |
| latency-label            | expanded 底部专网状态条文案；为空时回退到 `node-label`                                         | `string`               | `''`                 |

### Events

| 名称                        | 说明                                 | 回调                 |
| --------------------------- | ------------------------------------ | -------------------- |
| select                      | 菜单项选中（直达项与二级项统一出口） | `(item: LxMenuItem)` |
| expand-change               | 分组展开状态变化                     | `(keys: string[])`   |
| update:mode / update:mobile | 受控更新                             | —                    |

移动端抽屉可通过关闭按钮、遮罩或 `Escape` 关闭；选中菜单项时也会请求宿主关闭抽屉。由宿主控制 `v-model:mobile`，组件会在抽屉关闭后恢复打开前的键盘焦点。

菜单项提供 `path` 时渲染为链接并由宿主的 `select` 事件处理路由；未提供 `path` 时渲染为按钮。每次激活只触发一次 `select`，分组标题只切换展开状态。

分组标题支持 `Enter` 和 `Space` 展开；rail 分组可用键盘打开子项浮层，`Escape` 关闭浮层并将焦点还给分组标题。所有过渡和品牌呼吸效果均遵守 `prefers-reduced-motion`。

### Slots

`brand`（品牌区）/ `append`（菜单追加区）/ `footer`（底部状态区）

默认 `footer` 会随 `mode` 切换形态：expanded 显示专网状态条、延迟文案、控制台设置和收起按钮；rail 显示 SLA 圆环、NODE 徽章和展开按钮。`latency-label` 只影响 expanded 状态条，rail 仍使用 `sla-value` 与 `node-label`。

## FAQ

**如何接 router？** 监听 `@select`，对无 `children` 的项 `router.push(item.path)`；`activeKey` 绑定 `route.name`。
