# LxButton 按钮

基于 Element Plus `el-button` 内核二次封装的业务按钮。三档工程高度（28/32/40px）、四种核心形态（主操作 / 次按钮 / 高危 / 文字）、loading 文案切换、图标统一走 `LxIcon`。组件不请求数据；提交行为由宿主驱动。

视觉规范源：`design/按钮体系/DESIGN.md`。

## 快速使用

### 组件示例

<script setup lang="ts">
import Basic from '../../src/components/LxButton/demo/basic.vue';
import FormDisabled from '../../src/components/LxButton/demo/form-disabled.vue';
import LoadingLayout from '../../src/components/LxButton/demo/loading-layout.vue';
import LxButton from '../../src/components/LxButton/index.vue';
</script>

<div class="lx-button-quick-example-row">
  <div class="lx-button-quick-example" data-testid="lx-button-quick-example">
    <LxButton type="primary">主操作</LxButton>
    <LxButton type="default">次按钮</LxButton>
    <LxButton type="text">行内查看</LxButton>
  </div>
  <p class="lx-button-demo-jump"><a href="#lx-button-demo-anchor">跳转到完整交互演示</a></p>
</div>

<style scoped>
.lx-button-quick-example-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin: 12px 0 24px;
}

.lx-button-quick-example {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.lx-button-demo-jump {
  margin: 0 0 8px;
}

.lx-button-demo-jump a {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  font-weight: 600;
}

@media (max-width: 640px) {
  .lx-button-demo-jump a {
    min-height: 44px;
  }
}
</style>

### 使用摘要

- 同一屏最多保留一个主操作按钮；其他并列任务使用次按钮。
- 表格行内操作使用文字形态；危险操作放在次要位置，可组合 `type="danger"` 与 `text`。

### 示例说明

- **本地交互**：批量删除警情、确认下发指令、指令下发、模拟请求失败与重试、新增警务服务、刷新数据、刷新图标数据；删除示例不会执行删除。
- **外观展示**：其他按钮展示形态、禁用态和组合方式；键盘焦点、图标提示仍可交互。
- **请求范围**：所有示例只更新本地状态，不请求后端；失败与重试示例展示错误保留和恢复反馈，不执行真实请求。

<div
  role="region"
  aria-labelledby="lx-button-demo-anchor"
>
  <Basic />
</div>

::: details 查看完整 Demo 源码
<<< ../../src/components/LxButton/demo/basic.vue
:::

示例可切换三档尺寸与组件示例深色预览（HUD），主题开关仅影响下方组件示例。完整按钮类型矩阵位于推荐用法下；图标、权限反馈与行内操作收在“更多示例”折叠区，并提供分组直达链接；页面末尾可展开完整 Demo 源码。推荐组合只保留一个可操作的 `primary`，块级主操作与它互斥。loading 示例用页面内定时器模拟异步提交；失败与重试示例保留本地错误状态并演示恢复，不请求后端。

## 状态与操作

### 宿主请求与失败反馈

`LxButton` 只负责触发点击和展示 loading；请求、业务成功判断、错误提示及重试由宿主负责。API 成功码、业务失败与网络异常由宿主按实际接口契约处理，提交锁在 `.finally()` 中释放。

### 加载布局

文字按钮提前绑定 `:loading="loading"`（初值为 `false`），或提前配置 `loadingText`，组件会预留 spinner 和两种文案的最大尺寸，加载前、中、后保持布局稳定。长文案在可用宽度内换行，块级按钮继续填满容器。未声明加载能力的普通按钮保持紧凑布局；首次加载时才动态添加 `loading` 或 `loadingText` 无法提前预留，应由宿主先声明状态。

默认插槽只渲染一次，加载文案出现时原插槽保持挂载并隐藏，不向辅助技术暴露，也不能获得焦点；插槽内部的计时器或副作用不会因切换加载文案而自动停止，须由调用方管理。

纯图标没有文案时仍保持方形；显式提供 `loadingText` 时保留原有“加载期间切换为文字按钮”的契约，此场景会改变宽度。需要完全稳定的布局时应从一开始使用带文字的按钮。

<LoadingLayout />

### 高危操作确认与恢复

删除、终断等高危操作由宿主先确认，再发起请求。取消确认时不发送请求；请求成功后才更新列表；请求失败时保留记录并允许重试。`LxButton` 不内置业务确认、请求或数据回滚。

[查看完整按钮宿主集成示例](/components/lxbutton-integration)

### 使用规则

- 表格行内操作一律使用 `type="text"`，禁止 primary 实底按钮（避免视觉噪声过载）。
- 同一屏主按钮（primary）上限 1 个，多任务降级为次按钮（default）。
- 高危操作（删除、终断）使用 `type="danger"` 并置于次要位置；宿主先确认，成功后更新数据，失败时保留数据并允许重试。

### 图标操作

前置、后置及纯图标统一按 `size="sm/md/lg"` 使用 13/14/16px 图标；窄屏仍保留这组图标档位，仅扩大按钮触控区域。

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

纯图标形态不渲染空文字节点，桌面下宽高跟随尺寸档并保持正方形；无 hover 或视口不宽于 640px 时会把按钮可见宽高至少扩至 44px，`size` 仍控制图标和字体档位。纯图标必须传入 `aria-label` 作为可访问名称；该值会在鼠标悬停和键盘聚焦时以 tooltip 展示，延迟 200ms，同一时刻只显示一个提示，鼠标悬停优先，离开后仍聚焦的按钮提示会恢复。键盘焦点下按 Escape 可关闭当前提示并保留按钮焦点，重新聚焦后提示会再次显示。提示切换时不使用淡入淡出，避免新旧浮层短暂重叠。Enter/Space 仍触发原生按钮，disabled/loading 状态不触发 tooltip。演示页会在按钮外显示简短标签以区分相似图标示例，不会改变组件尺寸或 accessible name。

tooltip 会按触发按钮最近的 `.lx-theme-hud` 容器同步主题令牌。浮层传送到 `body` 时仍保持与按钮一致的局部 HUD 外观。

触屏和窄屏没有稳定的 hover 提示。宿主应按空间和任务频率为图标操作提供相邻可见短标签，或直接使用带文字的按钮；不要把 tooltip 当作触屏用户唯一的动作说明。Demo 在窄屏下显示短标签作为一种可选组合。

禁用的纯图标按钮不会显示 tooltip。若禁用原因涉及权限或业务状态，应在按钮旁提供可见说明，并通过唯一的 `aria-describedby` id 关联，避免视觉用户和辅助技术用户都无法获知原因。普通文字按钮同样适用该契约：

```vue
<LxButton
  type="default"
  icon="refresh"
  aria-label="刷新数据"
  aria-describedby="refresh-disabled-reason"
  disabled
/>
<span id="refresh-disabled-reason">当前账号无刷新权限</span>
```

### 危险行内按钮

表格行内的高危操作（移出布控、强制离线等）使用 `type="danger"` + `text` 组合：红字无底色、hover 浅红底，既守住"行内一律文字形态"铁律又保留危险语义。

```vue
<!-- 危险文字：标本"移出布控"行内操作 -->
<LxButton type="danger" text>移出布控</LxButton>

<!-- 危险纯图标：同样必须提供 aria-label -->
<LxButton type="danger" text icon="delete" aria-label="移出布控" />
```

红字取 `--lx-color-error-strong`（#b54747）而非标本 #f56c6c：12px 级小字号红字在白底需满足 4.5:1 对比度（DESIGN-SPEC §3.2）。

### 文字形态语义色与自定义色

文字形态可使用语义色组合（hover 底均为对应色 8% 透明度浅底）。成功绿色只用于“启用”类状态切换动作；普通审批、确认等操作使用主色或中性形态，完成结果再用成功状态反馈表达。页面主操作使用实底主按钮；表格行内轻量操作使用文字形态，高危操作继续使用危险语义并放在次级位置：

成功和警示文字分别使用 `--lx-color-success-text` 与 `--lx-color-warning-text`；HUD 主题提供对应的亮字令牌。禁用按钮会清除危险、成功等语义色，改用主题中性表面和独立的可读禁用文字令牌；文字形态保留透明底。默认、悬停和按下状态均以 4.5:1 为文字对比度门槛，自定义 `textColor` 的对比度由调用方负责。

```vue
<LxButton type="success" text>启用区域监控</LxButton>
<LxButton type="warning" text>催办预警</LxButton>
```

语义色之外的自定义场景（品牌强调色、链接继承色等）用 `textColor`：

```vue
<!-- 仅文字形态生效；hover 浅底自动按该色 8% 派生 -->
<!-- 浅色表面使用深蓝，HUD 深色表面改用亮蓝，分别满足正文对比度要求 -->
<LxButton type="text" text-color="#00508f">自定义色链接</LxButton>
<LxButton type="text" text-color="#7dd3fc">HUD 自定义色链接</LxButton>
<LxButton type="danger" text text-color="#9f1239">深红强调</LxButton>
```

## API

### 表单禁用与动态插槽

未传入 `disabled` 时继承父级 `LxForm`/`ElForm` 的禁用状态，同时阻止点击和纯图标提示；显式 `disabled=false` 按内核契约覆盖表单禁用，仅在确实需要例外的操作中使用。动态添加默认文字插槽时，按钮会退出纯图标布局并关闭图标提示，移除后恢复。

<FormDisabled />

### Props

| 名称           | 类型                                                                     | 默认值      | 说明                                                                                           |
| -------------- | ------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------- |
| `type`         | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'default' \| 'text'` | `'default'` | 按钮形态；`text` 为行内无底色文字形态；成功绿色仅用于“启用”类状态切换动作。                    |
| `text`         | `boolean`                                                                | `false`     | 无底色文字形态开关；与 `type="danger"` 等组合得到语义文字按钮。                                |
| `textColor`    | `string`                                                                 | `''`        | 自定义文字色（仅文字形态生效）；hover 浅底按该色 8% 透明度自动派生。                           |
| `size`         | `'sm' \| 'md' \| 'lg'`                                                   | `'md'`      | 桌面工程尺寸：28 / 32 / 40px，字号为 12 / 14 / 14px；无 hover 或视口不宽于 640px 时至少 44px。 |
| `loading`      | `boolean`                                                                | `false`     | 加载态：spinner + 点击拦截 + `aria-busy`，透明度降至 0.8。                                     |
| `loadingText`  | `string`                                                                 | `''`        | 加载态文案（如“下发指令中…”）；仅 `loading` 时替换按钮文字。                                   |
| `disabled`     | `boolean`                                                                | 继承表单，表单外为 `false` | 禁用态；使用中性表面与可读灰字，文字形态保持透明底；显式 `false` 可覆盖表单禁用。 |
| `icon`         | `LxIconName`                                                             | `undefined` | 图标名，统一由 `LxIcon` 渲染（currentColor 跟随文字色）。                                      |
| `iconPosition` | `'left' \| 'right'`                                                      | `'left'`    | 图标位置；loading 时前置图标自动让位给 spinner，后置图标保留。                                 |
| `block`        | `boolean`                                                                | `false`     | 块级撑满容器宽。                                                                               |
| `nativeType`   | `'button' \| 'submit' \| 'reset'`                                        | `'button'`  | 原生 `type` 属性；`submit/reset` 交给外层表单。                                                |

### Events

| 名称    | 参数                  | 说明                                              |
| ------- | --------------------- | ------------------------------------------------- |
| `click` | `(event: MouseEvent)` | 点击时派发；`loading` / `disabled` 状态下不派发。 |

### Slots

| 名称      | 说明                                   |
| --------- | -------------------------------------- |
| `default` | 按钮文字内容；loading 有文案时被替换。 |

## 宿主接入

### 与设计示例的差异

| 偏差项       | 标本                              | 实现                                 | 依据                                                                 |
| ------------ | --------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| 危险文字色   | `#f56c6c`                         | `--lx-color-error-strong`（#b54747） | 白底小字号对比度 ≥4.5:1                                              |
| 主操作色     | `--lx-btn-primary-bg`（#0060a9）  | `--lx-color-primary`（#0060a9）      | 组件工程契约中的主色 token；`#409eff` 是辅助容器色，不用于主操作实底 |
| 彩色实底文字 | 白字（danger/success/warning 行） | 深字 `--lx-color-on-*`（#1d2129）    | 对比度核验后选择达 WCAG AA 的深色文字                                |
| 圆角令牌     | `--lx-btn-radius`                 | `--lx-radius-md`（全局令牌复用）     | 全局令牌与组件令牌分层，避免同值重复定义                             |
| 尺寸档名     | `height-default`                  | `height-md`                          | 与 sm/lg 档名体系一致；映射关系见组件 SIZE_MAP                       |
| 禁用表达     | 全形态 opacity 0.45               | 主题中性表面与独立可读禁用文字令牌   | 保持禁用原因可读；原生 disabled 阻止操作                             |
| 字体         | 标本注明 Inter                    | 宿主字体栈                           | Inter 未在全站引入，字体统一由宿主主题层决定                         |

### 可访问性

键盘焦点为 2px 主色外环；触屏设备（`hover: none`）最小触控目标 44px；`loading` 时按钮带 `aria-busy="true"`；开启“减少动效”系统偏好时关闭过渡动画，并暂停 loading 图标旋转，保留静态状态图形。

### Vue3 宿主适配

业务层直接使用 `LxButton`（或全局组件名 `<LxButton />`），不再直用 `el-button`。宿主存量 `el-button` 直用页面按 UI-04 波次另行替换；`LxDialog` 底部操作栏已内置本组件。
