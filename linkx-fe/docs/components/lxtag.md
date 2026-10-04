# LxTag 浅底标签

P1 例外场景组件：状态标记必须用 LxStatusDot，仅当需要**携带文字信息**（关键词、检索条件、已选项）时才用 LxTag。浅底深字，包含品牌主色和四种反馈语义色。

小字可读性：success/warning 的底色和边框保留语义色，文字使用正文令牌，确保浅色主题达到正文对比度要求；深色主题随令牌同步。

<script setup lang="ts">
import { LxTag } from '../../src';
</script>

## 基础用法

<div class="demo-box" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
  <LxTag type="primary">8 项字段</LxTag><LxTag type="success">在线</LxTag><LxTag type="warning">降级</LxTag><LxTag type="error">高危</LxTag><LxTag type="info" closable>检索条件</LxTag>
</div>

```vue
<LxTag type="success">在线</LxTag>
<LxTag type="primary">8 项字段</LxTag>
<LxTag type="info" closable>检索条件</LxTag>
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

`default` — 标签文字内容。

## 使用铁律

- **选型**：状态展示用 LxStatusDot（点 + 文字），LxTag 只用于携带文字信息的场景（关键词、条件、已选人）。
- `type` 是反馈语义（成功/警告/错误/中性），不要用它表达设备状态机。
