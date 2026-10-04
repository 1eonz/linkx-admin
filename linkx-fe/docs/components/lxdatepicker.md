# LxDatePicker 日期选择器

基于 Element Plus `el-date-picker` 内核二次封装的日期选择器。32px 触发器、主色日历图标、值文字等宽字体（font-mono 契约）；**周一起始为默认契约**——组件内置 zh-cn 日历语境（`provideGlobalConfig`，与 `ElConfigProvider` 等价），不依赖宿主全局 locale 配置；区间分隔符默认中文"至"（EP 原生默认 `-`）；拖选区间呈连贯浅蓝带 `#ecf5ff`、起止主色圆点白字（EP 原生 + 变量注入）。`disabled-date`/`default-value`/`unlink-panels` 等经 attrs 透传。

视觉规范源：`design/表单控件八件套/code.html` 06。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxDatePicker/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxDatePicker/demo/basic.vue
:::

## Props

| 名称               | 类型                                                                                                                              | 默认值           | 说明                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `modelValue`       | `string \| number \| Date \| (string\|number\|Date)[]`                                                                            | —                | 选中值（v-model；区间类型为二元数组，配 `valueFormat` 时为格式化字符串）。                           |
| `type`             | `'date' \| 'daterange' \| 'datetime' \| 'datetimerange' \| 'dates' \| 'week' \| 'month' \| 'monthrange' \| 'year' \| 'yearrange'` | `'date'`         | 面板类型；`quarter` 等新增类型经 attrs 透传扩展。                                                    |
| `placeholder`      | `string`                                                                                                                          | `''`             | 占位文案（单值形态）。                                                                               |
| `startPlaceholder` | `string`                                                                                                                          | `''`             | 区间起始占位（range 形态）。                                                                         |
| `endPlaceholder`   | `string`                                                                                                                          | `''`             | 区间结束占位（range 形态）。                                                                         |
| `rangeSeparator`   | `string`                                                                                                                          | `'至'`           | 区间分隔符；Lx 默认中文契约（EP 原生默认 `-`）。                                                     |
| `disabled`         | `boolean`                                                                                                                         | —（`undefined`） | 禁用态：半透明 + 禁用手势。默认未设置：`ElForm` 禁用态可正常传导；显式传 `true`/`false` 才覆盖继承。 |
| `readonly`         | `boolean`                                                                                                                         | `false`          | 只读态：可聚焦不可改值。                                                                             |
| `clearable`        | `boolean`                                                                                                                         | `true`           | 可清空：值非空时悬停清除按钮（EP 原生默认 true）。                                                   |
| `format`           | `string`                                                                                                                          | —                | 显示格式（dayjs format，如 `YYYY-MM-DD`）。                                                          |
| `valueFormat`      | `string`                                                                                                                          | —                | 值格式（不传则 v-model 为 Date 对象；传则按格式序列化）。                                            |
| `shortcuts`        | `{ text: string; value: Date \| (() => Date \| [Date, Date]) }[]`                                                                 | —                | 快捷预设（今日/本周/近30天；位置随 EP 原生左侧竖排，裁剪记录 #8）。                                  |
| `size`             | `'sm' \| 'md' \| 'lg'`                                                                                                            | `'md'`           | 工程尺寸：28 / 32 / 40px；档名区别于 EP 的 `small/default/large`。                                   |
| `name`             | `string`                                                                                                                          | —                | 原生 name 属性。                                                                                     |

## Events

| 名称                | 参数                  | 说明                               |
| ------------------- | --------------------- | ---------------------------------- |
| `update:modelValue` | `(value)`             | 选中值变化。                       |
| `change`            | `(value)`             | 面板确认/清除后值变化（EP 原生）。 |
| `focus`             | `(event: FocusEvent)` | 聚焦。                             |
| `blur`              | `(event: FocusEvent)` | 失焦。                             |

## Exposes

| 名称    | 说明         |
| ------- | ------------ |
| `focus` | 聚焦触发器。 |
| `blur`  | 移除焦点。   |

## Slots

| 名称                        | 参数                                | 说明                                                                                             |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `default`                   | `DateCell`（Element Plus 导出类型） | 自定义日期单元，包含 `text`、`dayjs`、`isCurrent` 等内核原始字段；不提供时保留内核默认日期单元。 |
| `range-separator`           | —                                   | 自定义区间分隔符；不提供时使用 `rangeSeparator`。                                                |
| `prev-month` / `next-month` | —                                   | 前后月导航图标；不提供时使用内核默认图标。                                                       |
| `prev-year` / `next-year`   | —                                   | 前后年导航图标；面板支持对应导航时生效。                                                         |
| `sidebar`                   | `{ class: string }`                 | 面板侧栏，参数由内核传入；自定义内容须自行保留键盘与可访问名称。                                 |

日期单元插槽保留 `el-date-table-cell` 与 `el-date-table-cell__text` 结构时，可继续使用内核的选中、范围和当前日期样式。区间字段通过 attrs 传入成对 `id`，并分别用 `<label for>` 关联开始/结束输入；单值字段使用一个 `id`。

## 低频 props 透传

`disabled-date`（禁用日期谓词）、`default-value`、`unlink-panels`（双面板独立翻页）、`editable`、`popper-class`（与组件锚定类 `lx-date-picker__popper` 合并保留）、`calendar-change`/`panel-change` 监听器等经 attrs 直达 EP 内核：

```vue
<LxDatePicker
  v-model="range"
  type="daterange"
  value-format="YYYY-MM-DD"
  unlink-panels
  :disabled-date="(date: Date) => date.getTime() > Date.now()"
/>
```

## 周一起始契约

组件 setup 内置 `provideGlobalConfig({ locale: zhCn })`（dayjs zh-cn `weekStart: 1`）：面板周表头为"一 二 三 四 五 六 日"，文档站与宿主均无需配置全局 locale。该注入为子树级：不影响宿主其他 EP 组件的全局语境。

## 与标本的对齐说明

| 契约项     | 标本 06              | 实现                                                           |
| ---------- | -------------------- | -------------------------------------------------------------- |
| 周表头     | 一 二 三 四 五 六 日 | 内置 zh-cn 语境（周一起始）                                    |
| 区间分隔符 | "至"                 | 默认值差异（EP 原生 `-`）                                      |
| 区间连贯带 | `#ecf5ff` 浅蓝带     | `--lx-color-primary-light` 经 EP 变量注入 popper（组件级固化） |
| 起止日期   | 主色圆点白字         | EP 原生提供                                                    |
| 前置图标   | 日历图标主色         | `--lx-color-primary` 覆写                                      |
| 值文字     | font-mono            | `--lx-font-mono`                                               |
| 快捷预设   | 今日/本周/近30天     | `shortcuts` 契约；位置随 EP 原生（裁剪记录 #8）                |
| 双月联动   | 展开双月面板         | EP 原生 + `unlink-panels` 透传                                 |
| 触控目标   | 32px                 | 触屏（`hover: none`）44px（与输入类族同族契约）                |

## 可访问性

触发器为 combobox 语义（EP 内核）；单值与区间形态键盘可达（Tab 切换起止输入）；宿主通过 `aria-describedby` 传入的说明 ID 会同步到实际输入框，区间形态会关联开始和结束输入，相邻日期字段之间互不串联；错误态红底红边在 `LxForm` 校验上下文自动生效（组件级固化，脱离全局桥不漂移）；开启"减少动效"时边框过渡关闭。

## Vue3 宿主适配

业务层直接使用 `LxDatePicker`（或全局组件名 `<LxDatePicker />`）。旧 Vue2 项目的 `el-date-picker` 周起始依赖全局 locale 配置，迁移后由组件内置语境保证，无需宿主重复配置；宿主存量 `el-date-picker` 直用页面按 UI-04 波次另行替换。
