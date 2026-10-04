<script setup lang="ts">
import { ref } from 'vue'
import LxTextarea from '../index.vue'

const hudTheme = ref(false)

/** 布控指令说明：正常态含字数统计（标本 08 左列） */
const instruction = ref(
  '实行双警携犬网格化巡逻，每日08:00至22:00重点巡检人流聚集部位。',
)
/** 补充备注：autosize 随内容撑开（无 maxlength 计数器落域外） */
const remark = ref('夜间 22:00 后加强商圈和地下枢纽联络道防范。')
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
  lastAction.value = `${field} 已输入 ${value.length} 字`
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
      <h4>基础状态（标本八件套 08）</h4>
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
            show-word-limit
            placeholder="请输入针对该区域的布控细则..."
            @change="reportChange('布控指令', instruction)"
          />
          <p class="lx-textarea-demo__tip">
            最多 200
            字；达到上限后继续输入不会写入。需要保留超限内容时使用下方校验模式。
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
            placeholder="输入不超过 200 字的涉密核验备忘..."
          />
          <p class="lx-textarea-demo__tip">
            校验模式保留超限内容，并显示错误底色、提示和红色计数
          </p>
        </div>
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
            autosize 2~6 行自适应；无 maxlength 计数器落域外下方
          </p>
        </div>
        <div class="lx-textarea-demo__field">
          <label
            class="lx-textarea-demo__label lx-textarea-demo__label--disabled"
            for="demo-locked"
          >
            涉密核验备忘 (锁定)
          </label>
          <LxTextarea
            id="demo-locked"
            model-value="受上级指令系统锁定，本级不可改动。"
            :rows="3"
            disabled
          />
          <p class="lx-textarea-demo__tip">禁用态：灰底 + 禁用手势</p>
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
          <p class="lx-textarea-demo__tip">resize 关闭拖拽（默认 vertical）</p>
        </div>
      </div>
    </section>

    <p class="lx-textarea-demo__status" aria-live="polite">{{ lastAction }}</p>
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
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-textarea-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-textarea-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

.lx-textarea-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-textarea-demo__panel h4 {
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
}

.lx-textarea-demo__field {
  display: grid;
  gap: 6px;
  min-width: 0;
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
.lx-textarea-demo__note,
.lx-textarea-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}
</style>
