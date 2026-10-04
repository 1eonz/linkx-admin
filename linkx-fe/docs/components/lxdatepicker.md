# LxDatePicker 日期选择器

封装 Element Plus 日期内核，默认周一起始，区间分隔符为“至”，窄屏切换单面板。

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
| `shortcuts`        | `{ text: string; value: Date \| (() => Date \| [Date, Date]) }[]`                                                                 | —                | 快捷预设；桌面沿用 EP 侧栏，窄屏显示为日历上方横排按钮。                                             |
| `popperClass`      | `string`                                                                                                                          | —                | teleported 日期弹层的附加类；可响应式切换主题，不覆盖组件锚定类。                                    |
| `size`             | `'sm' \| 'md' \| 'lg'`                                                                                                            | `'md'`           | 工程尺寸：28 / 32 / 40px；档名区别于 EP 的 `small/default/large`。                                   |
| `name`             | `string`                                                                                                                          | —                | 原生 name 属性。                                                                                     |
| `singlePanel`      | `boolean`                                                                                                                         | 按视口自适应     | 区间日历单面板显示；视口不大于 640px 时默认开启，显式 `true/false` 可覆盖。                          |

## Events

| 名称                | 参数                  | 说明                               |
| ------------------- | --------------------- | ---------------------------------- |
| `update:modelValue` | `(value)`             | 选中值变化。                       |
| `change`            | `(value)`             | 面板确认/清除后值变化（EP 原生）。 |
| `visible-change`    | `(visible: boolean)`  | 日期面板展开或收起。               |
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

日期单元插槽保留 `el-date-table-cell` 与 `el-date-table-cell__text` 结构时，可继续使用内核的选中、范围和当前日期样式。

## 低频 props 透传

`disabled-date`（禁用日期谓词）、`default-value`、`unlink-panels`（开启后双面板独立翻页；默认随另一面板联动）、`editable`、`calendar-change`/`panel-change` 监听器等经 attrs 直达 EP 内核：

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

组件通过 `provideGlobalConfig({ locale: zhCn })` 为自身及日期面板提供中文 locale，并注册 Day.js `zh-cn` 数据。Element Plus 日期表格据此将单值和区间面板设为周一起始；组件不调用全局 `dayjs.locale()`，宿主当前 locale 保持不变。

## 与标本的对齐说明

视觉规范源：`design/表单控件八件套/code.html` 06。

| 契约项     | 标本 06              | 实现                                                           |
| ---------- | -------------------- | -------------------------------------------------------------- |
| 周表头     | 一 二 三 四 五 六 日 | 内置 zh-cn 语境（周一起始）                                    |
| 区间分隔符 | "至"                 | 默认值差异（EP 原生 `-`）                                      |
| 区间连贯带 | `#ecf5ff` 浅蓝带     | `--lx-color-primary-light` 经 EP 变量注入 popper（组件级固化） |
| 起止日期   | 主色圆点与高对比文字 | 圆点沿用 EP 内核；文字使用 `--lx-color-on-primary`             |
| 前置图标   | 日历图标主色         | `--lx-color-primary` 覆写                                      |
| 值文字     | font-mono            | `--lx-font-mono`                                               |
| 快捷预设   | 今日/本周/近30天     | `shortcuts` 契约；桌面左侧纵排，窄屏日历上方横排               |
| 双月联动   | 展开双月面板         | EP 原生 + `unlink-panels` 透传                                 |
| 触控目标   | 32px                 | 触屏（`hover: none`）44px（与输入类族同族契约）                |

## 可访问性

区间双输入需成对关联 ID 和 label：`:id="['start', 'end']"` 配 `<label for="start">`、`<label for="end">`。完整标注示例见上方交互 Demo。

触发器为 combobox 语义（EP 内核）；单值与区间形态键盘可达：聚焦输入框后按 ArrowDown 打开日历并进入日期网格，方向键移动日期焦点，Enter 选择日期，Escape 关闭日历；区间形态可用 Tab 切换起止输入，窄屏单面板会把两个端点的焦点都放入当前可见网格。宿主通过 `aria-describedby` 传入的说明 ID 会同步到实际输入框，区间形态会关联开始和结束输入，相邻日期字段之间互不串联；错误态红底红边在 `LxForm` 校验上下文自动生效（组件级固化，脱离全局桥不漂移）；开启"减少动效"时边框过渡关闭。

窄屏（视口宽度不大于 640px）下快捷预设改为日历上方的横排按钮，日期格与翻月按钮提供至少 44px 的触控区域。弹层完整落在视口内时继续锚定触发器；若高度不足导致越界，则切换到视口居中显示，定位箭头隐藏，日期面板内部可滚动，滚动不会带动页面。组件关闭或恢复宽屏布局后继续使用 Element Plus 原生定位。

周首由已注册并注入日期对象的 Day.js `zh-cn` locale 决定；组件不会切换宿主的全局默认 locale。

## Vue3 宿主适配

业务层直接使用 `LxDatePicker`（或全局组件名 `<LxDatePicker />`）。旧 Vue2 项目的 `el-date-picker` 周起始依赖全局 locale 配置，迁移后由组件内置语境保证，无需宿主重复配置；宿主存量 `el-date-picker` 直用页面按 UI-04 波次另行替换。
