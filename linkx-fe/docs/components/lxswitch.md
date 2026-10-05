# LxSwitch 状态开关

LxSwitch 是用于表单设置与可逆业务状态的通用开关。

## 交互示例

开关切换仅更新本页的演示状态，不保存业务配置；下发结果由本地内存模拟。

<script setup lang="ts">
import Basic from '../../src/components/LxSwitch/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxSwitch/demo/basic.vue
:::

## Props {#lxswitch-props}

<dl class="lx-switch-props">
  <div class="lx-switch-props__item">
    <dt class="lx-switch-props__name"><code>modelValue</code></dt>
    <dd class="lx-switch-props__detail">
      <p class="lx-switch-props__meta"><span>类型：<code>boolean | string | number</code></span><span>默认值：<code>false</code></span></p>
      <p class="lx-switch-props__description">开关值（v-model；自定义值通过 <code>active-value</code> 透传属性设置）。</p>
    </dd>
  </div>
  <div class="lx-switch-props__item">
    <dt class="lx-switch-props__name"><code>activeText</code></dt>
    <dd class="lx-switch-props__detail">
      <p class="lx-switch-props__meta"><span>类型：<code>string</code></span><span>默认值：—</span></p>
      <p class="lx-switch-props__description">开启态文字；<code>inlinePrompt</code> 时显示在胶囊内，否则显示在胶囊右侧。</p>
    </dd>
  </div>
  <div class="lx-switch-props__item">
    <dt class="lx-switch-props__name"><code>inactiveText</code></dt>
    <dd class="lx-switch-props__detail">
      <p class="lx-switch-props__meta"><span>类型：<code>string</code></span><span>默认值：—</span></p>
      <p class="lx-switch-props__description">关闭态文字；<code>inlinePrompt</code> 时显示在胶囊内，否则显示在胶囊左侧。</p>
    </dd>
  </div>
  <div class="lx-switch-props__item">
    <dt class="lx-switch-props__name"><code>inlinePrompt</code></dt>
    <dd class="lx-switch-props__detail">
      <p class="lx-switch-props__meta"><span>类型：<code>boolean</code></span><span>默认值：<code>true</code></span></p>
      <p class="lx-switch-props__description">文字显示在胶囊内；开启后胶囊放宽至 42px 容纳两字文案。Lx 默认 true（与 Element Plus 原生默认 false 有意不同），两侧文字模式显式传 <code>false</code>。</p>
    </dd>
  </div>
  <div class="lx-switch-props__item">
    <dt class="lx-switch-props__name"><code>disabled</code></dt>
    <dd class="lx-switch-props__detail">
      <p class="lx-switch-props__meta"><span>类型：<code>boolean</code></span><span>默认值：未设置（<code>undefined</code>）</span></p>
      <p class="lx-switch-props__description">禁用态：胶囊半透明并禁用手势（标本 07“上级锁定”行）。默认未设置时不阻断 Element Plus 内核的禁用继承（loading 拦截和 <code>ElForm</code> 禁用传导）；显式传 <code>true</code>/<code>false</code> 才覆盖继承。</p>
    </dd>
  </div>
  <div class="lx-switch-props__item">
    <dt class="lx-switch-props__name"><code>loading</code></dt>
    <dd class="lx-switch-props__detail">
      <p class="lx-switch-props__meta"><span>类型：<code>boolean</code></span><span>默认值：<code>false</code></span></p>
      <p class="lx-switch-props__description">加载态：滑块显示 spinner 并拦截点击。</p>
    </dd>
  </div>
  <div class="lx-switch-props__item">
    <dt class="lx-switch-props__name"><code>name</code></dt>
    <dd class="lx-switch-props__detail">
      <p class="lx-switch-props__meta"><span>类型：<code>string</code></span><span>默认值：—</span></p>
      <p class="lx-switch-props__description">原生 name 属性。</p>
    </dd>
  </div>
</dl>

## Events

| 名称                | 参数      | 说明         |
| ------------------- | --------- | ------------ |
| `update:modelValue` | `(value)` | 开关值变化。 |
| `change`            | `(value)` | 开关切换。   |

## Element Plus 属性透传

`active-value`/`inactive-value`（自定义开关值）、`before-change`（切换前拦截）作为透传属性交给 Element Plus 内核：

```vue
<LxSwitch v-model="mode" active-value="on" inactive-value="off" />
```

## 与标本的对齐说明

视觉规范源：`design/表单控件八件套/code.html` 07。

| 契约项     | 标本 07                | 实现                                                                    |
| ---------- | ---------------------- | ----------------------------------------------------------------------- |
| 胶囊几何   | 40×20 胶囊 + 16px 滑块 | Element Plus 内核默认值恰好对齐，显式固化防升级漂移                     |
| 开启色     | #67c23a（成功绿）      | `--lx-color-success` 注入 Element Plus 开关变量                         |
| 关闭色     | #909399（信息灰）      | `--lx-color-info` 注入 Element Plus 开关变量                            |
| 禁用       | #67c23a/50 半透明      | 胶囊 opacity 0.5                                                        |
| 状态文字   | 外部"开启/关闭"文字    | 宿主布局表达（状态不能只靠颜色区分）                                    |
| 胶囊内文字 | —（衍生场景）          | `inlinePrompt` 默认 true：42px 胶囊 + 11px/600 深灰对比文字，主用法形态 |
| size 档    | —                      | 有意识裁剪，胶囊尺寸唯一                                                |

## 可访问性

每个开关都必须提供准确的可访问名称；可通过 `aria-label` 或 `aria-labelledby` 为内部原生控件命名，`aria-describedby` 会同步到内部控件。隐藏 input 保持键盘可达；Enter 沿用 Element Plus 行为，空格由封装触发受控切换，确保原生 `checked`、`aria-checked` 和 `v-model` 同步。键盘焦点显示主色外环。触屏设备的命中区域至少为 44×44px，胶囊本体仍保持设计规定的尺寸。

loading、禁用和业务下发失败由宿主按实际状态提供；本组件不发起业务请求。Demo 使用本地内存模拟首次失败和再次成功，展示失败时保留原值、重试后同步控件值与状态播报。

## Vue3 宿主适配

业务层直接使用 `LxSwitch`（或全局组件名）。`element-theme.css` 对裸 `el-switch` 的全局色彩桥保留过渡期；表格行内状态列继续用 `LxStatusSwitch`。
