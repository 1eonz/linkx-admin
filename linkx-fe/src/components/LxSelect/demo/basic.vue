<script setup lang="ts">
import { ElOption } from 'element-plus'
import { ref } from 'vue'

import LxSelect from '../index.vue'

const hudTheme = ref(false)

/** Panel 1 基础单选：布控等级（标本 02 文案语境） */
const controlLevel = ref<string>('2')
/** 可清空单选：处置通道 */
const channel = ref<string>('encrypted')
/** Panel 2 多选：所属单位（折叠展示） */
const units = ref<string[]>(['city-bureau'])
/** Panel 3 可过滤：指挥中心 */
const commandCenter = ref<string>('')
/** Panel 4 远程检索：值班警员（前端模拟远程，不请求后端） */
const dutyOfficer = ref<string>('')
const remoteLoading = ref(false)
const remoteOptions = ref<string[]>([])
const remotePool = [
  '赵国强 031204',
  '钱伟民 031187',
  '孙丽华 031243',
  '李建军 031096',
  '周雅雯 031268',
  '吴海涛 031155',
]
let remoteSeed = 0

/** Panel 5 禁用态 */
const lockedChannel = ref<string>('satellite')

const lastAction = ref(
  '选择选项观察触发器与面板行为；演示数据仅存在于页面内存。',
)

function reportChange(field: string, value: unknown) {
  lastAction.value = `${field} 已选：${Array.isArray(value) ? value.join('、') : value}`
}

/** 远程检索模拟：600ms 延迟返回过滤结果（宿主接入时替换为真实接口） */
function searchOfficer(query: string) {
  const seed = ++remoteSeed
  remoteLoading.value = true
  window.setTimeout(() => {
    if (seed !== remoteSeed) return
    remoteOptions.value = remotePool.filter((item) =>
      item.includes(query.trim()),
    )
    remoteLoading.value = false
  }, 600)
}
</script>

<template>
  <div class="lx-select-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-select-demo__toolbar">
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-select-demo__panel" data-testid="basic">
      <h4>
        基础单选（32px 触发器 + 1px 边框；展开态箭头旋转 + 已选文字转主色）
      </h4>
      <div class="lx-select-demo__row">
        <div class="lx-select-demo__field">
          <label class="lx-select-demo__label" for="demo-select-level"
            >布控等级</label
          >
          <LxSelect
            id="demo-select-level"
            v-model="controlLevel"
            placeholder="请选择布控等级"
            @change="reportChange('布控等级', $event)"
          >
            <ElOption label="一级布控" value="1" />
            <ElOption label="二级布控" value="2" />
            <ElOption label="三级布控" value="3" />
          </LxSelect>
        </div>
        <div class="lx-select-demo__field">
          <label class="lx-select-demo__label" for="demo-select-channel"
            >处置通道（可清空）</label
          >
          <LxSelect
            id="demo-select-channel"
            v-model="channel"
            clearable
            placeholder="请选择处置通道"
            @change="reportChange('处置通道', $event)"
            @clear="lastAction = '处置通道已清空'"
          >
            <ElOption label="高密加密专线" value="encrypted" />
            <ElOption label="卫星应急链路" value="satellite" />
            <ElOption label="视频会商通道" value="video" />
          </LxSelect>
        </div>
      </div>
    </section>

    <section class="lx-select-demo__panel" data-testid="multiple">
      <h4>多选与折叠（超出折叠为 +N，悬停可见完整列表）</h4>
      <div class="lx-select-demo__field">
        <label class="lx-select-demo__label" for="demo-select-units"
          >协同单位</label
        >
        <LxSelect
          id="demo-select-units"
          v-model="units"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择协同单位"
          @change="reportChange('协同单位', $event)"
          @remove-tag="lastAction = `已移除：${$event}`"
        >
          <ElOption label="市局指挥中心" value="city-bureau" />
          <ElOption label="分局合成作战中心" value="branch" />
          <ElOption label="交警支队" value="traffic" />
          <ElOption label="特巡警支队" value="patrol" />
          <ElOption label="网安支队" value="cyber" />
        </LxSelect>
      </div>
    </section>

    <section class="lx-select-demo__panel" data-testid="filterable">
      <h4>本地过滤（输入关键字检索选项）</h4>
      <div class="lx-select-demo__field">
        <label class="lx-select-demo__label" for="demo-select-center"
          >指挥中心</label
        >
        <LxSelect
          id="demo-select-center"
          v-model="commandCenter"
          filterable
          placeholder="输入关键字检索"
          @change="reportChange('指挥中心', $event)"
        >
          <ElOption label="市局指挥中心" value="city" />
          <ElOption label="城东分局指挥室" value="east" />
          <ElOption label="城西分局指挥室" value="west" />
          <ElOption label="高新区指挥室" value="hi-tech" />
        </LxSelect>
      </div>
    </section>

    <section class="lx-select-demo__panel" data-testid="remote">
      <h4>远程检索（remote + remote-method 经 attrs 透传；loading 面板态）</h4>
      <div class="lx-select-demo__field">
        <label class="lx-select-demo__label" for="demo-select-officer"
          >值班警员</label
        >
        <LxSelect
          id="demo-select-officer"
          v-model="dutyOfficer"
          filterable
          remote
          :remote-method="searchOfficer"
          :loading="remoteLoading"
          placeholder="输入警号或姓名检索"
          @change="reportChange('值班警员', $event)"
        >
          <ElOption
            v-for="item in remoteOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </LxSelect>
      </div>
      <p class="lx-select-demo__hint">
        Demo 以前端 600ms 延迟模拟远程数据源，宿主接入时 remote-method
        指向真实接口；旧请求返回晚于新请求时被种子值丢弃，避免旧结果覆盖新状态。
      </p>
    </section>

    <section class="lx-select-demo__panel" data-testid="disabled">
      <h4>禁用态（半透明 + 禁用手势）</h4>
      <div class="lx-select-demo__field">
        <label class="lx-select-demo__label" for="demo-select-locked"
          >应急链路（锁定）</label
        >
        <LxSelect id="demo-select-locked" :model-value="lockedChannel" disabled>
          <ElOption label="卫星应急链路" value="satellite" />
          <ElOption label="高密加密专线" value="encrypted" />
        </LxSelect>
      </div>
    </section>

    <p class="lx-select-demo__status" aria-live="polite">{{ lastAction }}</p>
    <p class="lx-select-demo__note">
      触发器 32px / 4px 圆角 / 1px #dcdfe6 边框，hover 与展开转主色；面板选项
      32px 行高，选中项 #f5f7fa 底 + 主色 500 字重 + 右侧 Check。
    </p>
  </div>
</template>

<style scoped>
.lx-select-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-select-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-select-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

.lx-select-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-select-demo__panel h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-select-demo__row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.lx-select-demo__field {
  display: grid;
  flex: 1 1 200px;
  gap: 4px;
  min-width: 0;
}

.lx-select-demo__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-text-label);
}

.lx-select-demo__field .lx-select {
  width: 100%;
}

.lx-select-demo__hint,
.lx-select-demo__status,
.lx-select-demo__note {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--lx-text-secondary);
}

.lx-select-demo__note {
  color: var(--lx-color-warning-strong);
}
</style>
