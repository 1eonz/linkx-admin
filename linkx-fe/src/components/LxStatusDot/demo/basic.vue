<script setup lang="ts">
import { ref } from 'vue'

import Recovery from './recovery.vue'
import WithText from './with-text.vue'
import { LxCheckbox, LxStatusDot, type LxStatus } from '../../../index'

const hud = ref(false)
const pulse = ref(true)
const states: LxStatus[] = ['online', 'processing', 'busy', 'error', 'offline']
const longDescription =
  '城域监测节点暂未收到心跳，请先查看链路详情并联系值班人员确认网络状态。'

/** 文档宿主注入本地适配器，不访问后端；展示组件只消费结果。 */
function loadStatus(
  signal: AbortSignal,
  scenario: string,
): Promise<LxStatus | null> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(new DOMException('已取消本次刷新', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      if (scenario === 'failure')
        reject(new Error('模拟链路超时，请检查网络后重新刷新。'))
      else if (scenario === 'forbidden')
        reject(new Error('模拟权限不足，请联系管理员确认查看权限。'))
      else resolve(scenario === 'empty' ? null : 'online')
    }, 400)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  })
}
</script>

<template>
  <section class="lx-status-demo" :class="{ 'lx-theme-hud': hud }">
    <header class="lx-status-demo__row">
      <LxCheckbox v-model="hud">HUD 深色主题</LxCheckbox>
      <LxCheckbox v-model="pulse">开启在线呼吸</LxCheckbox>
    </header>
    <section aria-label="五种语义状态">
      <h3>五种状态</h3>
      <div class="lx-status-demo__row" data-testid="status-semantics">
        <LxStatusDot
          v-for="state in states"
          :key="state"
          :status="state"
          show-text
          :pulse="pulse"
        />
      </div>
      <p>
        只有在线状态呼吸；减少动效时自动静止。状态由圆点与中文名称共同表达。
      </p>
    </section>
    <section aria-label="圆点尺寸">
      <h3>尺寸与静态状态</h3>
      <div class="lx-status-demo__row" data-testid="status-sizes">
        <LxStatusDot
          v-for="size in [6, 8, 10]"
          :key="size"
          status="online"
          :size="size"
          :pulse="false"
          :status-desc="size + ' 像素'"
          show-text
        />
      </div>
    </section>
    <section aria-label="数字兼容映射">
      <h3>库内数字兼容映射</h3>
      <div class="lx-status-demo__codes">
        <span v-for="code in [0, 1, 2, 3, 4, 5, 6, 7]" :key="code">
          <span>{{ code }} →</span
          ><LxStatusDot :code="code" :pulse="false" show-text />
        </span>
      </div>
      <p>
        直接调用库时 0 为离线；旧业务适配器保留 0
        为忙碌。未知值仅采用离线视觉兜底。
      </p>
    </section>
    <section aria-label="密集列表与长文本">
      <h3>密集静态列表与长说明</h3>
      <div class="lx-status-demo__row" data-testid="status-dense">
        <LxStatusDot
          v-for="index in 24"
          :key="index"
          status="online"
          :pulse="false"
          :status-desc="'节点 ' + index + ' 在线'"
        />
      </div>
      <div class="lx-status-demo__long" data-testid="status-long">
        <LxStatusDot status="error" :status-desc="longDescription" show-text />
        <LxStatusDot
          status="processing"
          :status-desc="'GatewayMonitoringNode'.repeat(5)"
          show-text
        />
      </div>
      <p>同屏超过 20 个状态点应关闭呼吸。长说明完整换行，不依赖悬停读取。</p>
    </section>
    <section aria-label="名册状态列">
      <h3>表格状态列</h3>
      <WithText />
    </section>
    <section aria-label="宿主状态恢复">
      <h3>宿主负责加载和恢复</h3>
      <Recovery :load-status="loadStatus" />
    </section>
  </section>
</template>

<style scoped>
.lx-status-demo {
  min-width: 0;
  padding: var(--lx-space-lg);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}
.lx-status-demo__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--lx-space-lg);
}
.lx-status-demo > section {
  margin-top: var(--lx-space-xl);
}
.lx-status-demo h3 {
  margin: 0 0 var(--lx-space-md);
  color: var(--lx-text-primary);
  font-size: 14px;
  line-height: 20px;
}
.lx-status-demo p {
  margin: var(--lx-space-md) 0 0;
  color: var(--lx-text-regular);
  font-size: 13px;
  line-height: 20px;
}
.lx-status-demo__codes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
  gap: var(--lx-space-md);
}
.lx-status-demo__codes > span {
  display: flex;
  align-items: center;
  gap: var(--lx-space-sm);
}
.lx-status-demo__long {
  display: grid;
  width: 100%;
  max-width: 260px;
  gap: var(--lx-space-md);
  margin-top: var(--lx-space-lg);
}
</style>
