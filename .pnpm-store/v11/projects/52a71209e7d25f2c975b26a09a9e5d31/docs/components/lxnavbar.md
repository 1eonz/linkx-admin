# LxNavbar 顶部导航

用于后台应用顶部的搜索、网络状态、通知、全屏和用户菜单。路由跳转、搜索请求、通知列表和账号操作均由宿主处理。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxNavbar/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxNavbar/demo/basic.vue
:::

示例以本地事件状态展示搜索、通知和用户菜单；不会请求接口或执行真实账号操作。

## Props

| 名称                | 类型           | 默认值     | 说明                                         |
| ------------------- | -------------- | ---------- | -------------------------------------------- |
| `searchPlaceholder` | `string`       | `'搜索…'`  | 显示全局搜索框；空字符串时隐藏。             |
| `notificationCount` | `number`       | —          | 显示通知徽标；大于 99 时显示 `99+`。         |
| `networkLabel`      | `string`       | `''`       | 网络状态旁的文字；空字符串时隐藏状态区。     |
| `networkStatus`     | `LxStatus`     | `'online'` | 传给 `LxStatusDot` 的状态。                  |
| `user`              | `LxNavbarUser` | —          | 用户名、可选角色和头像；提供后显示用户菜单。 |
| `showFullscreen`    | `boolean`      | `true`     | 是否显示全屏切换按钮。                       |

`LxNavbarUser` 包含 `name: string`、可选 `role: string` 和 `avatar: string`。

## Events

| 事件                 | 参数                                  | 说明                                               |
| -------------------- | ------------------------------------- | -------------------------------------------------- |
| `search`             | `keyword: string`                     | Enter 时发出去除首尾空格的搜索词。                 |
| `notification-click` | 无                                    | 点击通知按钮时发出。                               |
| `fullscreen-toggle`  | `full: boolean`                       | 全屏状态同步后发出；浏览器拒绝全屏时报告实际状态。 |
| `user-command`       | `'profile' \| 'password' \| 'logout'` | 用户菜单命令，由宿主执行对应流程。                 |

## 插槽

| 名称         | 位置                    |
| ------------ | ----------------------- |
| `leading`    | 左侧品牌/应用入口之前。 |
| `breadcrumb` | 左侧面包屑区域。        |
| `trailing`   | 右侧工具之后。          |

搜索输入、通知、全屏和用户菜单都有可访问名称；窄屏隐藏网络状态和用户辅助文字，搜索框收窄。在线脉冲由 `LxStatusDot` 控制并尊重减少动效设置。

## 使用边界

- 组件仅发出事件，不执行搜索、退出登录、改密或通知读取请求。
- 全屏按钮调用浏览器 Fullscreen API；嵌入式或受限浏览器拒绝时会同步实际全屏状态，不把失败报告为已进入。
- 用户头像是装饰内容，替代文本为空；用户名仍作为用户菜单按钮的可访问名称。
