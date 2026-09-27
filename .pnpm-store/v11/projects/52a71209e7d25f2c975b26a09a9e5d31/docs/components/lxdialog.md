# LxDialog 表单弹窗

三段式弹窗容器（图标标题栏 / 内容区 / 右对齐按钮栏），默认最大宽度 **672px**（设计稿 max-w-2xl 表单弹窗规格）；窄屏下宽度收至视口内、表单改为单列并扩大点按目标。危险模式全局变红。

<script setup lang="ts">
import Basic from '../../src/components/LxDialog/demo/basic.vue';
</script>

## 基础用法（双列新建表单）

<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxDialog/demo/basic.vue
:::

## API

### Props

| 名称                       | 说明                                      | 类型               | 默认值                    |
| -------------------------- | ----------------------------------------- | ------------------ | ------------------------- |
| v-model                    | 显隐                                      | `boolean`          | `false`                   |
| title                      | 标题（14px 加粗）                         | `string`           | —                         |
| icon                       | 标题图标                                  | `LxIconName`       | —                         |
| width                      | 最大宽度；窄屏时受视口宽度约束            | `number \| string` | `672`（设计稿 max-w-2xl） |
| danger                     | 危险模式（红图标 / 红标题 / 红底确认）    | `boolean`          | `false`                   |
| confirm-text / cancel-text | 按钮文案                                  | `string`           | `确认` / `取消`           |
| loading                    | 确认按钮加载态                            | `boolean`          | `false`                   |
| close-on-click-modal       | 点遮罩关闭                                | `boolean`          | `false`（防误触）         |
| close-on-press-esc         | 按 ESC 关闭（脏数据敏感场景可关）         | `boolean`          | `true`                    |
| draggable                  | 头部拖拽移动弹窗位置（header 即拖拽把手） | `boolean`          | `true`                    |
| hide-footer                | 隐藏默认按钮栏                            | `boolean`          | `false`                   |

固定行为：**屏幕垂直居中**（align-center）、append-to-body、8px 圆角。

### Events

| 名称                | 说明                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `update:modelValue` | 对话框因关闭按钮、取消、ESC 或允许的遮罩点击关闭时更新为 `false` |
| confirm             | 确认点击（业务在此校验 / 提交，成功后自行关闭）                  |
| cancel              | 点击默认取消按钮时触发，随后更新 `v-model` 为 `false`            |

### Slots

`default`（表单区，建议双列 grid，配 LxForm columns=2）/ `footer`（hide-footer 时完全自定义）。Header 槽接收 Element Plus 的 `titleId` 和 `titleClass`，组件将标题关联到对话框的可访问名称；组件不暴露实例方法。

## 使用铁律

- **弹窗选型**：表单用 LxDialog；详情用 LxDrawer（设计稿明确「详情不走弹窗」）；纯确认用 lxConfirm。
- 提交时 `loading` 置 true 防重复；校验不通过弹窗不关，配 LxFormErrorBanner 提示。
- 关闭回调里清空表单与校验残留（`nextTick(clearValidate)`）。
