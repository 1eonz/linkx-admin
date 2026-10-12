# LxButton 宿主集成示例

`LxButton` 只处理点击、禁用和 loading 展示。请求、业务结果判断、确认流程、错误提示及数据更新由 Vue3 宿主负责。所有接口调用继续使用 `.then().catch().finally()`。

## 普通提交与错误恢复

`saveRequest` 由宿主注入：业务成功时 resolve，业务失败和网络异常时 reject。若接口使用成功 HTTP 响应承载业务失败，宿主应在 `.then()` 中先按接口契约判断。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LxButton, lxMessage } from 'lx-ui'

const props = defineProps<{
  saveRequest: () => Promise<void>
}>()
const submitting = ref(false)

function handleSave() {
  if (submitting.value) return
  submitting.value = true

  Promise.resolve()
    .then(() => props.saveRequest())
    .then(() => {
      lxMessage.success('保存成功')
    })
    .catch(() => {
      lxMessage.error('保存失败，请重试')
    })
    .finally(() => {
      submitting.value = false
    })
}
</script>

<template>
  <LxButton type="primary" :loading="submitting" @click="handleSave">
    保存配置
  </LxButton>
</template>
```

## 高危操作确认与恢复

取消确认时不发送请求；只有请求成功后才从宿主数据中移除记录；请求失败时保留记录、提示失败并允许用户重试。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LxButton, lxMessage } from 'lx-ui'

const props = defineProps<{
  confirmDelete: () => Promise<boolean>
  deleteRequest: () => Promise<void>
}>()
const actionPending = ref(false)

function handleDelete() {
  if (actionPending.value) return
  actionPending.value = true

  Promise.resolve()
    .then(() => props.confirmDelete())
    .then((confirmed) => {
      if (!confirmed) return
      return props
        .deleteRequest()
        .then(() => {
          lxMessage.success('删除成功')
        })
        .catch(() => {
          lxMessage.error('删除失败，记录已保留，可重试')
        })
    })
    .catch(() => {
      lxMessage.error('确认操作失败，请重试')
    })
    .finally(() => {
      actionPending.value = false
    })
}
</script>

<template>
  <LxButton type="danger" text :loading="actionPending" @click="handleDelete">
    批量删除
  </LxButton>
</template>
```

确认和请求函数由宿主注入。宿主应在成功分支更新列表，失败分支不得提前移除记录。

[返回 LxButton 组件说明](/components/lxbutton)
