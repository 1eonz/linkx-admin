<script setup lang="ts">
import { onMounted, reactive } from 'vue';

import type { ScheduleItem } from '@/api/shiftScheduling';

defineOptions({ name: 'DutyCalendar' });

const props = defineProps<{
  /** 日历数据：{ 'YYYY-MM-DD': ScheduleItem[] } */
  calendarList: Record<string, ScheduleItem[]> | null;
  /** 当前选中的排班类型（用于决定 popover 中显示 dutyTypeName 还是 postName） */
  dutyTypeFilter: string;
}>();

const emit = defineEmits<{
  (e: 'prev-month'): void;
  (e: 'next-month'): void;
}>();

// 日历结构
interface CalendarObj {
  weekDayNameList: string[];
  firstDayWeek: number;
  lastDayNum: number;
  emptyWeekDayNum: number;
  emptyLastWeekDayNum: number;
  prevMonthDays: number[];
  nextMonthDays: number[];
  searchObj: { year: number; month: number };
}

const calendarObj = reactive<CalendarObj>({
  weekDayNameList: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  firstDayWeek: 0,
  lastDayNum: 0,
  emptyWeekDayNum: 0,
  emptyLastWeekDayNum: 0,
  prevMonthDays: [],
  nextMonthDays: [],
  searchObj: { year: 0, month: 0 },
});

// 格式化时间：去除秒（'HH:mm:ss' → 'HH:mm'）
function formatTimeRemoveSeconds(timeStr?: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// 判断值班是否已过期
function isDutyExpired(dutyDate?: string, dutyEndTime?: string): boolean {
  if (!dutyDate || !dutyEndTime) return false;
  const endDateTime = new Date(`${dutyDate} ${dutyEndTime}`);
  return endDateTime < new Date();
}

// 获取排班颜色 class：过期灰色，否则循环 3 色
function getDutyColorClass(duty: ScheduleItem, index: number): string {
  if (isDutyExpired(duty.dutyEndDate, duty.dutyEndTime)) {
    return 'listColor_disable';
  }
  return `listColor${index % 3}`;
}

// 按日期 key 取当天值班数据
function getCalendarObj(dayNumber: number): ScheduleItem[] | undefined {
  if (!props.calendarList) return undefined;
  const key = `${calendarObj.searchObj.year}-${String(calendarObj.searchObj.month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
  return props.calendarList[key];
}

// 从 dateStr 解析年月（无参则取当前年月）
function getYearAndMonth(dateStr?: string): void {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  calendarObj.searchObj.year = targetDate.getFullYear();
  calendarObj.searchObj.month = targetDate.getMonth() + 1;
}

// 计算上下月空位
function getMonthDaysObj(prevShowDay: number, nextShowDay: number): void {
  const prevLen = typeof prevShowDay === 'number' && prevShowDay > 0 ? Math.floor(prevShowDay) : 0;
  const nextLen = typeof nextShowDay === 'number' && nextShowDay > 0 ? Math.floor(nextShowDay) : 0;
  const now = new Date();
  const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const prevMonthDays: number[] = [];
  for (let i = 0; i < prevLen; i++) {
    prevMonthDays.unshift(lastDayOfPrevMonth - i);
  }
  const nextMonthDays: number[] = [];
  for (let i = 0; i < nextLen; i++) {
    nextMonthDays.push(i + 1);
  }
  calendarObj.prevMonthDays = prevMonthDays;
  calendarObj.nextMonthDays = nextMonthDays;
}

// 计算当月首日周几、当月天数、空位数
function getMonthDayDate(year?: number, month?: number): void {
  const now = new Date();
  calendarObj.searchObj.year = year || now.getFullYear();
  calendarObj.searchObj.month = month || now.getMonth() + 1;
  const firstDayWeek = new Date(calendarObj.searchObj.year, calendarObj.searchObj.month - 1, 1).getDay();
  const lastDayNum = new Date(calendarObj.searchObj.year, calendarObj.searchObj.month, 0).getDate();
  const lastDayWeek = new Date(calendarObj.searchObj.year, calendarObj.searchObj.month - 1, lastDayNum).getDay();
  calendarObj.firstDayWeek = firstDayWeek;
  calendarObj.lastDayNum = lastDayNum;
  const list = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  calendarObj.emptyWeekDayNum = calendarObj.weekDayNameList.indexOf(list[firstDayWeek]);
  calendarObj.emptyLastWeekDayNum = calendarObj.weekDayNameList.indexOf(list[lastDayWeek]);
  getMonthDaysObj(calendarObj.emptyWeekDayNum, 6 - calendarObj.emptyLastWeekDayNum);
}

// 上月/下月计算
function getTargetMonth(type: 'prev' | 'next'): void {
  const currentYear = calendarObj.searchObj.year;
  const currentMonth = calendarObj.searchObj.month;
  let targetYear: number;
  let targetMonth: number;
  if (type === 'prev') {
    if (currentMonth === 1) {
      targetMonth = 12;
      targetYear = currentYear - 1;
    } else {
      targetMonth = currentMonth - 1;
      targetYear = currentYear;
    }
  } else {
    if (currentMonth === 12) {
      targetMonth = 1;
      targetYear = currentYear + 1;
    } else {
      targetMonth = currentMonth + 1;
      targetYear = currentYear;
    }
  }
  calendarObj.searchObj.year = targetYear;
  calendarObj.searchObj.month = targetMonth;
}

function goPrevMonth(): void {
  getTargetMonth('prev');
  getMonthDayDate(calendarObj.searchObj.year, calendarObj.searchObj.month);
  emit('prev-month');
}

function goNextMonth(): void {
  getTargetMonth('next');
  getMonthDayDate(calendarObj.searchObj.year, calendarObj.searchObj.month);
  emit('next-month');
}

/** 暴露给父组件：初始化日历、从 dateStr 同步年月、读取当前年月、月份切换 */
defineExpose({
  getMonthDayDate,
  getYearAndMonth,
  getSearchObj: () => ({ year: calendarObj.searchObj.year, month: calendarObj.searchObj.month }),
  goPrevMonth,
  goNextMonth,
});

// 组件挂载时初始化当月日历结构（因为 v-if 延迟挂载，父组件 onMounted 时本组件还不存在）
onMounted(() => {
  getMonthDayDate();
});
</script>

<template>
  <div class="duty-calendar">
    <!-- 日历网格（仅渲染日历主体，月份导航和视图切换由主页面负责） -->
    <div class="calendar-list">
      <div class="week-name">
        <div v-for="(weekName, index) in calendarObj.weekDayNameList" :key="`weekDayNameList${index}`">
          {{ weekName }}
        </div>
      </div>
      <div class="week-day">
        <div v-for="(item, index) in calendarObj.prevMonthDays" :key="`prevMonthDays${index}`" class="day day-empty">
          {{ item }}
        </div>
        <div v-for="(item, index) in calendarObj.lastDayNum" :key="`lastDayNum${index}`" class="day">
          <div class="day-num">{{ item }}</div>
          <el-popover v-if="getCalendarObj(item)" placement="top-start" :width="320" trigger="hover">
            <div class="zb-info popover-content">
              <div
                v-for="(calObj, idx) in getCalendarObj(item)"
                :key="calObj.id"
                class="zblist zblist-popover-item"
                :class="getDutyColorClass(calObj, idx)"
              >
                <div class="zblist-item-title">
                  {{ formatTimeRemoveSeconds(calObj.dutyStartTime) }}-{{ formatTimeRemoveSeconds(calObj.dutyEndTime) }}
                  {{ calObj.departmentName ? `${calObj.departmentName}-` : '' }}{{ calObj.userName
                  }}{{
                    dutyTypeFilter !== ''
                      ? calObj.dutyTypeName
                        ? `(${calObj.dutyTypeName})`
                        : ''
                      : calObj.postName
                        ? `(${calObj.postName})`
                        : ''
                  }}
                </div>
                <div>{{ calObj.dutyContent }}</div>
              </div>
            </div>
            <template #reference>
              <div class="zb-info">
                <div
                  v-for="(calObj, idx) in getCalendarObj(item)?.slice(0, 4)"
                  :key="calObj.id"
                  class="zblist text-single"
                  :class="getDutyColorClass(calObj, idx)"
                >
                  {{ formatTimeRemoveSeconds(calObj.dutyStartTime) }}-{{ formatTimeRemoveSeconds(calObj.dutyEndTime) }}
                  {{ calObj.departmentName ? `${calObj.departmentName}-` : '' }}{{ calObj.userName
                  }}{{
                    dutyTypeFilter !== ''
                      ? calObj.dutyTypeName
                        ? `(${calObj.dutyTypeName})`
                        : ''
                      : calObj.postName
                        ? `(${calObj.postName})`
                        : ''
                  }}
                </div>
                <div v-if="(getCalendarObj(item)?.length ?? 0) > 4" class="zblist more">
                  还有 {{ (getCalendarObj(item)?.length ?? 0) - 4 }} 条...
                </div>
              </div>
            </template>
          </el-popover>
        </div>
        <div v-for="(item, index) in calendarObj.nextMonthDays" :key="`nextMonthDays${index}`" class="day day-empty">
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.duty-calendar {
  // 月份导航和视图切换由主页面负责，这里只渲染日历主体
}

.calendar-list {
  .week-name {
    display: flex;
    justify-content: space-between;

    div {
      width: calc(100% / 7 - 10px);
      height: @calendar-week-height;
      line-height: @calendar-week-height;
      text-align: center;
      background: @color-calendar-week-bg;
      font-size: @font-size-2xl;
      font-weight: @font-weight-medium;
      color: @color-calendar-week-text;
    }
  }

  .week-day {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    .day {
      width: calc(100% / 7 - 10px);
      height: @calendar-day-height;
      padding: 10px;
      border-radius: @radius-sm;
      border: 1px solid @color-calendar-border;
      margin-top: 10px;
      font-size: @font-size-2xl;
      font-weight: @font-weight-medium;
      color: @color-calendar-day-muted;
      display: flex;
      flex-direction: column;

      .day-num {
        color: @color-calendar-day-text;
      }
    }

    .day-empty {
      border-color: transparent;
    }
  }
}

.zb-info {
  flex: 1;
  max-height: 80px;
  overflow-y: auto;
  scrollbar-width: thin;
  -ms-overflow-style: auto;

  // P0 主题色冲突：rgba(37,99,235,1) 是 Tailwind blue-600，应改用项目主色 @color-primary
  .listColor0 {
    border-color: @color-calendar-list0-border;
    color: @color-calendar-list0-border;
    background: @color-calendar-list0-bg;
  }
  .listColor1 {
    border-color: @color-calendar-list1-border;
    color: @color-calendar-list1-border;
    background: @color-calendar-list1-bg;
  }
  .listColor2 {
    border-color: @color-calendar-list2-border;
    color: @color-calendar-list2-border;
    background: @color-calendar-list2-bg;
  }
  .listColor_disable {
    border-color: @color-calendar-disable-border;
    color: @color-calendar-disable-text;
    background: @color-calendar-disable-bg;
  }

  .zblist {
    height: 20px;
    width: 100%;
    border-width: 1px;
    border-style: dotted;
    line-height: 20px;
    font-size: @font-size-xs;
    font-weight: @font-weight-normal;
    padding: 0 @spacing-xs;
    margin-top: @spacing-xs-plus;
  }

  .zblist-popover-item {
    height: auto;
    min-height: 40px;
    padding: @spacing-xs-plus @spacing-sm;
    margin-top: @spacing-sm;
    display: flex;
    flex-direction: column;
    gap: @spacing-xs;

    .zblist-item-title {
      font-weight: @font-weight-medium;
    }
  }

  .zblist.more {
    text-align: center;
    color: @color-text-secondary;
    border: none;
    background: transparent;
    height: auto;
    margin-top: @spacing-xs;
  }
}

.text-single {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 滚动条样式（非 scoped 才能生效，使用 :deep 穿透） */
:deep(.zb-info)::-webkit-scrollbar {
  width: 2px;
}
:deep(.zb-info)::-webkit-scrollbar-thumb {
  background: @color-scrollbar-thumb-dark;
  border-radius: 1px;
}
:deep(.zb-info)::-webkit-scrollbar-track {
  background: transparent;
}
</style>
