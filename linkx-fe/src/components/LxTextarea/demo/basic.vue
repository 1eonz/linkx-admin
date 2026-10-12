<script setup lang="ts">
import { ref } from 'vue'

import LxButton from '../../LxButton/index.vue'
import LxTextarea from '../index.vue'

const hudTheme = ref(false)

/** 布控指令说明：正常态含长度计数（标本 08 左列） */
const instruction = ref(
  '实行双警携犬网格化巡逻，每日08:00至22:00重点巡检人流聚集部位。',
)
/** 补充备注：autosize 随内容撑开；未设置 maxlength 时不显示计数器 */
const remark = ref('夜间 22:00 后加强商圈和地下枢纽联络道防范。')
const insideCountMemo = ref('内嵌计数随内容长度同步更新。')
/** 空值示例：演示焦点、输入、变更事件及公开的 focus/blur 方法 */
const supplementalNote = ref('')
const supplementalTextarea = ref<InstanceType<typeof LxTextarea>>()
const lastChanged = ref('尚无')
/** 超限校验示例：保留超出的内容并展示与设计稿一致的错误反馈 */
const overflowMemo = ref(
  [
    '已超限输入：该区域已被列为一级涉密管制区，所有过往车辆需逐一双重比对核验。',
    '遇到无牌照或假套牌嫌疑车辆时，立即启动一级阻截封控预案，并通过指挥大厅同步上报。',
    '值班人员需要记录车辆特征、人员信息、处置时间与复核结果，确保现场处置与后续审计记录完整。',
    '所有临时通行申请须由当班指挥员复核，未经确认不得解除管控或转交其他勤务组。',
    '完成复核后登记审批人、复核时间和解除依据，相关材料按要求归档，确保任务交接和责任追溯有据可查。',
  ].join(''),
)

const lastAction = ref('输入内容观察计数器；演示数据仅存在于页面内存。')

function reportChange(field: string, value: string) {
  lastChanged.value = `${field} 内容长度为 ${value.length}`
  lastAction.value = lastChanged.value
}

function reportInput(field: string, value: string) {
  lastAction.value = `${field} 正在输入，当前内容长度 ${value.length}`
}

function reportFocus(field: string) {
  lastAction.value = `${field} 已聚焦`
}

function reportBlur(field: string) {
  lastAction.value = `${field} 已失焦`
}

function focusSupplementalTextarea() {
  supplementalTextarea.value?.focus()
}

function blurSupplementalTextarea() {
  supplementalTextarea.value?.blur()
}
</script>

<template>
  <div class="lx-textarea-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-textarea-demo__toolbar">
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-textarea-demo__panel" data-testid="states">
      <h3>基础状态（标本八件套 08）</h3>
      <div class="lx-textarea-demo__grid">
        <div class="lx-textarea-demo__field">
          <label class="lx-textarea-demo__label" for="demo-instruction"
            >处置要求及布控指令说明</label
          >
          <LxTextarea
            id="demo-instruction"
            v-model="instruction"
            :rows="3"
            :maxlength="200"
            aria-describedby="demo-instruction-limit-hint"
            placeholder="请输入针对该区域的布控细则..."
            @change="reportChange('布控指令', instruction)"
          />
          <p id="demo-instruction-limit-hint" class="lx-textarea-demo__tip">
            长度上限为
            200；达到上限后继续输入不会写入。需要保留超限内容时使用下方校验模式。
          </p>
        </div>
        <div class="lx-textarea-demo__field">
          <label class="lx-textarea-demo__label" for="demo-overflow"
            >涉密核验备忘（溢出校验态）</label
          >
          <LxTextarea
            id="demo-overflow"
            v-model="overflowMemo"
            :rows="3"
            :maxlength="200"
            maxlength-mode="validate"
            show-word-limit
            placeholder="填写涉密核验备忘（长度上限 200）..."
          />
          <p class="lx-textarea-demo__tip">
            保留超限内容，并提供持续更新的错误说明
          </p>
        </div>
      </div>
    </section>

    <details class="lx-textarea-demo__details" data-testid="advanced-states">
      <summary>其他状态与交互</summary>
      <section
        class="lx-textarea-demo__panel"
        data-testid="advanced-layout-and-state"
      >
        <h3>尺寸与编辑状态</h3>
        <div class="lx-textarea-demo__grid">
          <div class="lx-textarea-demo__field">
            <label class="lx-textarea-demo__label" for="demo-remark"
              >布控执勤特情备注</label
            >
            <LxTextarea
              id="demo-remark"
              v-model="remark"
              :autosize="{ minRows: 2, maxRows: 6 }"
              show-word-limit
              placeholder="输入相关补充指令..."
              @change="reportChange('特情备注', remark)"
            />
            <p class="lx-textarea-demo__tip">
              autosize 2~6 行自适应；未设置 maxlength 时不显示计数器
            </p>
          </div>
          <div class="lx-textarea-demo__field">
            <label class="lx-textarea-demo__label" for="demo-inside-count"
              >值班简报（内嵌计数）</label
            >
            <LxTextarea
              id="demo-inside-count"
              v-model="insideCountMemo"
              :rows="3"
              :maxlength="120"
              word-limit-position="inside"
              placeholder="填写简短值班简报"
            />
          </div>
          <div class="lx-textarea-demo__field">
            <label
              class="lx-textarea-demo__label lx-textarea-demo__label--disabled"
              for="demo-locked"
            >
              涉密核验备忘（锁定）
            </label>
            <LxTextarea
              id="demo-locked"
              model-value="受上级指令系统锁定，本级不可改动。"
              :rows="3"
              :maxlength="200"
              disabled
            />
            <p class="lx-textarea-demo__tip">禁用态：灰底 + 禁用手势</p>
          </div>
          <div class="lx-textarea-demo__field">
            <label
              class="lx-textarea-demo__label lx-textarea-demo__label--disabled"
              for="demo-overflow-disabled"
            >
              禁用的超限核验备忘
            </label>
            <LxTextarea
              id="demo-overflow-disabled"
              :model-value="overflowMemo"
              :rows="3"
              :maxlength="200"
              maxlength-mode="validate"
              disabled
            />
            <p class="lx-textarea-demo__tip">
              禁用校验态保留错误说明并隐藏长度计数
            </p>
          </div>
          <div class="lx-textarea-demo__field">
            <label class="lx-textarea-demo__label" for="demo-noresize"
              >固定高度说明</label
            >
            <LxTextarea
              id="demo-noresize"
              model-value="resize='none' 固定高度，不可拖拽。"
              :rows="3"
              resize="none"
            />
            <p class="lx-textarea-demo__tip">
              resize 关闭拖拽（默认 vertical）
            </p>
          </div>
          <div class="lx-textarea-demo__field">
            <label class="lx-textarea-demo__label" for="demo-readonly"
              >只读交接记录</label
            >
            <LxTextarea
              id="demo-readonly"
              model-value="已由值班人员确认，交接后仅可查看和复制。"
              :rows="3"
              :maxlength="200"
              readonly
            />
            <p class="lx-textarea-demo__tip">
              只读内容可选择和复制，但不能编辑
            </p>
          </div>
          <div class="lx-textarea-demo__field">
            <label class="lx-textarea-demo__label" for="demo-overflow-readonly">
              只读的超限核验备忘
            </label>
            <LxTextarea
              id="demo-overflow-readonly"
              :model-value="overflowMemo"
              :rows="3"
              :maxlength="200"
              maxlength-mode="validate"
              readonly
            />
            <p class="lx-textarea-demo__tip">
              只读校验态保留错误说明并隐藏长度计数
            </p>
          </div>
        </div>
      </section>
      <section class="lx-textarea-demo__panel" data-testid="advanced-methods">
        <h3>公开聚焦控制</h3>
        <div class="lx-textarea-demo__grid">
          <div class="lx-textarea-demo__field">
            <label class="lx-textarea-demo__label" for="demo-supplemental"
              >补充核验说明</label
            >
            <LxTextarea
              id="demo-supplemental"
              ref="supplementalTextarea"
              v-model="supplementalNote"
              :rows="3"
              :maxlength="120"
              show-word-limit
              placeholder="填写需要补充核验的事项"
              @input="reportInput('补充核验说明', $event)"
              @focus="reportFocus('补充核验说明')"
              @blur="reportBlur('补充核验说明')"
              @change="reportChange('补充核验说明', $event)"
            />
            <div class="lx-textarea-demo__method-actions">
              <LxButton
                class="lx-textarea-demo__method-button"
                size="md"
                @click="focusSupplementalTextarea"
                >聚焦文本域</LxButton
              >
              <LxButton
                class="lx-textarea-demo__method-button"
                size="md"
                text
                text-color="var(--lx-text-regular)"
                @click="blurSupplementalTextarea"
                >移除焦点</LxButton
              >
            </div>
            <p class="lx-textarea-demo__tip">
              留空时显示占位文案；按钮调用组件公开的 focus 和 blur 方法
            </p>
          </div>
        </div>
      </section>
    </details>

    <p class="lx-textarea-demo__status" aria-live="polite">{{ lastAction }}</p>
    <p
      class="lx-textarea-demo__change"
      data-testid="change-event"
      aria-live="polite"
    >
      最近 change：{{ lastChanged }}
    </p>
    <p class="lx-textarea-demo__note">
      默认 maxlength 硬截断；maxlength-mode="validate"
      用于需要保留超限内容并提示纠正的场景。
    </p>
  </div>
</template>

<style scoped>
.lx-textarea-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  color: var(--lx-text-primary);
  background: var(--lx-bg-page);
}

.lx-textarea-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-textarea-demo__toolbar label {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 44px;
}

.lx-textarea-demo__details {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.lx-textarea-demo__details summary {
  align-content: center;
  min-height: 44px;
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-textarea-demo__panel {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
}

.lx-textarea-demo__panel h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-textarea-demo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

@media (max-width: 480px) {
  .lx-textarea-demo__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .lx-textarea-demo__method-actions :deep(.lx-btn) {
    min-height: 44px;
  }
}

.lx-textarea-demo__field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.lx-textarea-demo__method-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lx-textarea-demo__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-text-label);
}

.lx-textarea-demo__label--disabled {
  color: var(--lx-text-placeholder);
}

.lx-textarea-demo__status,
.lx-textarea-demo__change,
.lx-textarea-demo__note,
.lx-textarea-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}
</style>
