# LxButton 按钮

基于 Element Plus `el-button` 内核二次封装的业务按钮。三档工程高度（28/32/40px）、四种核心形态（主操作 / 次按钮 / 高危 / 文字）、loading 文案切换、图标统一走 `LxIcon`。组件不请求数据；提交行为由宿主驱动。

视觉规范源：`design/按钮体系/code.html`（拍板 #11）。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxButton/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxButton/demo/basic.vue
:::

示例可切换三档尺寸与 HUD 深色主题；loading 示例用页面内定时器模拟异步提交，不请求后端。

## Props

| 名称           | 类型                                                                     | 默认值      | 说明                                                                 |
| -------------- | ------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------- |
| `type`         | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'default' \| 'text'` | `'default'` | 按钮形态；`text` 为无底色文字形态，用于行内轻量操作。                |
| `text`         | `boolean`                                                                | `false`     | 无底色文字形态开关；与 `type="danger"` 等组合得到语义文字按钮。      |
| `textColor`    | `string`                                                                 | `''`        | 自定义文字色（仅文字形态生效）；hover 浅底按该色 8% 透明度自动派生。 |
| `size`         | `'sm' \| 'md' \| 'lg'`                                                   | `'md'`      | 工程尺寸：28 / 32 / 40px；档名区别于 EP 的 `small/default/large`。   |
| `loading`      | `boolean`                                                                | `false`     | 加载态：spinner + 点击拦截 + `aria-busy`，透明度降至 0.8。           |
| `loadingText`  | `string`                                                                 | `''`        | 加载态文案（如"下发指令中..."）；仅 `loading` 时替换按钮文字。       |
| `disabled`     | `boolean`                                                                | `false`     | 禁用态；实底形态透明度 0.45，次按钮/文字形态用专用禁用色。           |
| `icon`         | `LxIconName`                                                             | `undefined` | 图标名，统一由 `LxIcon` 渲染（currentColor 跟随文字色）。            |
| `iconPosition` | `'left' \| 'right'`                                                      | `'left'`    | 图标位置；loading 时前置图标自动让位给 spinner，后置图标保留。       |
| `block`        | `boolean`                                                                | `false`     | 块级撑满容器宽。                                                     |
| `nativeType`   | `'button' \| 'submit' \| 'reset'`                                        | `'button'`  | 原生 `type` 属性；`submit/reset` 交给外层表单。                      |

## Events

| 名称    | 参数                  | 说明                                              |
| ------- | --------------------- | ------------------------------------------------- |
| `click` | `(event: MouseEvent)` | 点击时派发；`loading` / `disabled` 状态下不派发。 |

## Slots

| 名称      | 说明                                   |
| --------- | -------------------------------------- |
| `default` | 按钮文字内容；loading 有文案时被替换。 |

## 使用铁律（拍板 #11）

- 表格行内操作一律使用 `type="text"`，禁止 primary 实底按钮（避免视觉噪声过载）。
- 同一屏主按钮（primary）上限 1 个，多任务降级为次按钮（default）。
- 高危操作（删除、终断）使用 `type="danger"` 并置于次要位置。

## 文字形态的图标用法

`type="text"` 支持三种组合：

```vue
<!-- 图标 + 文字：图标随文字色，间距由组件统一 -->
<LxButton type="text" icon="search">检索详情</LxButton>

<!-- 图标后置 -->
<LxButton
  type="text"
  icon="chevron-right"
  icon-position="right"
>进入档案</LxButton>

<!-- 纯图标：必须提供 aria-label 作为可访问名称 -->
<LxButton type="text" icon="refresh" aria-label="刷新数据" />
```

纯图标形态不渲染空文字节点，保持方形点击区；触屏设备最小触控目标自动提升到 44px。纯图标时传入的 `aria-label` 会同时作为悬停 tooltip 对视觉用户展示（读屏用户仍由 `aria-label` 获得可访问名称），disabled/loading 状态下因内核拦截鼠标事件不触发 tooltip。

## 危险行内操作（文字形态语义组合）

表格行内的高危操作（移出布控、强制离线等）使用 `type="danger"` + `text` 组合：红字无底色、hover 浅红底，既守住"行内一律文字形态"铁律又保留危险语义。

```vue
<!-- 危险文字：标本"移出布控"行内操作 -->
<LxButton type="danger" text>移出布控</LxButton>

<!-- 危险纯图标：同样必须提供 aria-label -->
<LxButton type="danger" text icon="delete" aria-label="移出布控" />
```

红字取 `--lx-color-error-strong`（#b54747）而非标本 #f56c6c：12px 级小字号红字在白底需满足 4.5:1 对比度（DESIGN-SPEC §3.2）。

## 文字形态语义色与自定义色

文字形态支持全部语义色组合（hover 底均为对应色 8% 透明度浅底）：

成功和警示文字分别使用 `--lx-color-success-text` 与 `--lx-color-warning-text`，避免实底悬停色用于白底小字号时对比度不足；HUD 主题提供对应的亮字令牌。默认、悬停和按下状态均以 4.5:1 为文字对比度门槛，自定义 `textColor` 的对比度由调用方负责。

```vue
<LxButton type="success" text>核准归档</LxButton>
<LxButton type="warning" text>催办预警</LxButton>
```

语义色之外的自定义场景（品牌强调色、链接继承色等）用 `textColor`：

```vue
<!-- 仅文字形态生效；hover 浅底自动按该色 8% 派生 -->
<LxButton type="text" text-color="#7c3aed">自定义色链接</LxButton>
<LxButton type="danger" text text-color="#9f1239">深红强调</LxButton>
```

## 与标本的有意识偏差

| 偏差项       | 标本                                | 实现                                 | 依据                                                                 |
| ------------ | ----------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| 危险文字色   | `#f56c6c`                           | `--lx-color-error-strong`（#b54747） | 白底小字号对比度 ≥4.5:1                                              |
| 彩色实底文字 | 白字（danger/success/warning 行）   | 深字 `--lx-color-on-*`（#1d2129）    | 白字对比度仅 2.1~~2.9:1；深字约 6~~7:1 达 WCAG AA（2026-09-29 拍板） |
| 圆角令牌     | `--lx-btn-radius`                   | `--lx-radius-md`（全局令牌复用）     | 全局令牌与组件令牌分层，避免同值重复定义                             |
| 尺寸档名     | `height-default`                    | `height-md`                          | 与 sm/lg 档名体系一致；映射关系见组件 SIZE_MAP                       |
| 禁用令牌名   | `--lx-btn-primary-disabled-opacity` | `--lx-btn-disabled-opacity`          | 标本 primary/danger 禁用同为 0.45，统一为一档                        |
| 字体         | `--lx-btn-font-family: Inter`       | 宿主字体栈                           | Inter 未在全站引入，字体统一由宿主主题层决定                         |
| 禁用表达     | 全形态 opacity 0.45                 | 实底 0.45；次按钮/文字用专用禁用色   | 标本 default/text 禁用行本身就是专用色；透明度会把正文冲淡到不可读   |

## 可访问性

键盘焦点为 2px 主色外环；触屏设备（`hover: none`）最小触控目标 44px；`loading` 时按钮带 `aria-busy="true"`；开启"减少动效"系统偏好时关闭过渡动画。

## Vue3 宿主适配

业务层直接使用 `LxButton`（或全局组件名 `<LxButton />`），不再直用 `el-button`。宿主存量 `el-button` 直用页面按 UI-04 波次另行替换；`LxDialog` 底部操作栏已内置本组件。
