# LxTag 浅底标签

P1 例外场景组件：状态标记必须用 LxStatusDot，仅当需要**携带文字信息**（关键词、检索条件、已选项）时才用 LxTag。浅底深字，包含品牌主色和四种反馈语义色。

小字可读性：success/warning 的底色和边框保留语义色，文字使用正文令牌，确保浅色主题达到正文对比度要求；深色主题随令牌同步。
紧凑尺寸使用 11px 字号、16px 行高、上下 2px 和左右 6px 内距，与设计标本保持一致。

<script setup lang="ts">
import { LxTag } from '../../src';
</script>

## 基础用法

<div class="demo-box" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
  <LxTag type="primary">8 项字段</LxTag><LxTag size="small" type="primary">紧凑标签</LxTag><LxTag size="large" type="success">在线</LxTag><LxTag type="warning">降级</LxTag><LxTag type="error">高危</LxTag><LxTag type="info" closable>检索条件</LxTag><LxTag type="info" disabled>只读标签</LxTag>
</div>

```vue
<LxTag type="success">在线</LxTag>
<LxTag type="primary">8 项字段</LxTag>
<LxTag type="info" closable>检索条件</LxTag>
<LxTag size="large" type="success">大号标签</LxTag>
<LxTag type="info" disabled>只读标签</LxTag>
```

## API

### Props

| 名称     | 说明               | 类型                                                       | 默认值    |
| -------- | ------------------ | ---------------------------------------------------------- | --------- |
| type     | 品牌强调或反馈语义 | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `info`    |
| closable | 可关闭（显示 X）   | `boolean`                                                  | `false`   |
| size     | 尺寸               | `LxSize`                                                   | `default` |
| disabled | 禁用               | `boolean`                                                  | `false`   |

### Events

| 名称  | 说明         | 回调                  |
| ----- | ------------ | --------------------- |
| close | 关闭按钮点击 | `(event: MouseEvent)` |

### Slots

`default` — 标签文字内容。长文本会在可用宽度内省略，完整内容应由宿主通过 `title` 或辅助说明补充。

## 使用铁律

- **选型**：状态展示用 LxStatusDot（点 + 文字），LxTag 只用于携带文字信息的场景（关键词、条件、已选人）。
- `small`、`default`、`large` 分别提供 24px、24px、28px 的稳定最小高度；关闭按钮始终是可键盘触达的原生按钮。
- `disabled` 表示只读标签，不渲染关闭操作；它使用专用禁用令牌保持文字可读性，不依赖整体透明度表达状态。
- `type` 是反馈语义（成功/警告/错误/中性），不要用它表达设备状态机。
