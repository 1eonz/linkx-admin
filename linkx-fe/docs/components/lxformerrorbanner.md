# LxFormErrorBanner 校验横幅

浅红底 + 深红文字的表单校验阻断横幅（内联组件，非浮层）：用于表单提交前的**批量校验阻断**提示，区别于单字段行内错误。

<script setup lang="ts">
import Basic from '../../src/components/LxFormErrorBanner/demo/basic.vue';
</script>

## 基础用法

<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxFormErrorBanner/demo/basic.vue
:::

```vue
<LxFormErrorBanner
  title="校验阻断：当前区域处于战备封控期"
  description="封控期间禁止新增派单，请联系指挥中心调整封控范围后重试。"
/>
```

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 主文案（12px 粗体深红） | `string` | — |
| description | 补充说明（11px） | `string` | — |

### Slots

`default` — 扩展内容（如违规字段清单）。

## 使用铁律

- 定位是**业务规则阻断**（封控期禁新增、配额用尽等表单整体无法提交的场景），单字段格式错误走 LxForm 的行内错误态。
- 视觉规格：report 图标与文字顶部对齐、浅红底（`--lx-color-error-light`）、深红文字（`--lx-color-error-strong` 对比度补偿）。
- 出现在表单顶部，打开弹窗若业务校验失败即展示，修复后消失。
