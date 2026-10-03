<template>
  <header class="ls-readout">
    <div class="ls-readout-top">
      <div class="ls-readout-age">
        <span class="ls-readout-age-num">{{ time.年龄岁 }}</span>
        <span class="ls-readout-age-unit">岁</span>
        <span v-if="time.年龄月 > 0" class="ls-readout-age-month">{{ time.年龄月 }} 个月</span>
      </div>
      <AgeRing :age-year="time.年龄岁" :age-month="time.年龄月" />
    </div>

    <div class="ls-readout-meta">
      <template v-if="displayName">
        <span class="ls-readout-name">{{ displayName }}</span>
        <span class="ls-readout-sep">·</span>
      </template>
      <span>第 {{ time.回合 }} 回合</span>
      <span class="ls-readout-sep">·</span>
      <span>{{ spanLabel }}</span>
      <span class="ls-readout-sep">·</span>
      <span>{{ sex }}</span>
      <button class="ls-btn-quiet ls-readout-mode" type="button" @click="enterSlow">进入慢速模式</button>
    </div>

    <div class="ls-readout-span">
      <span class="ls-readout-span-label">跨度</span>
      <input v-model.number="span" class="ls-readout-range" type="range" min="1" max="60" step="1" />
      <span class="ls-readout-span-value">{{ span }} 个月</span>
      <button class="ls-btn-quiet" type="button" @click="applySpan">应用</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDataStore } from '../store';
import { 当前模式, 待发送更新事件, use待发送 } from '../待发送';
import AgeRing from './AgeRing.vue';

const store = useDataStore();
const 待发送 = use待发送();

const props = defineProps<{
  time: {
    回合: number;
    年: number;
    月: number;
    跨度: number;
    模式: string;
    年龄岁: number;
    年龄月: number;
    阶段: string;
  };
  sex: string;
  name: string;
}>();

const displayName = computed(() => props.name?.trim() || '');

const span = ref(props.time.跨度);

// 年/月 是回合结束时的读数，往前推算 (跨度 - 1) 个月得到起点
function shiftMonth(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta;
  if (total < 12) {
    return { year: 1, month: 1 };
  }
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

const spanLabel = computed(() => {
  const { 年, 月, 跨度 } = props.time;
  if (跨度 <= 1) {
    return `${年} 年 ${月} 月`;
  }
  const start = shiftMonth(年, 月, -(跨度 - 1));
  if (start.year === 年) {
    return `${年} 年 ${start.month} 月～${月} 月`;
  }
  return `${start.year} 年 ${start.month} 月～${年} 年 ${月} 月`;
});

watch(
  () => props.time.跨度,
  value => {
    span.value = value;
  },
);

function applySpan() {
  store.data.时间.跨度 = span.value;
}

// 模式切换由界面直接改写变量，改完立即生效，下一次发送时附一次模式切换声明
function enterSlow() {
  // 基准取切换前的模式：先记下来，再改变量，最后清空待发送并重写输入框，
  // 这样拼出的声明里才会带一条模式切换
  const 基准 = 当前模式();
  store.data.时间.模式 = '分钟推进';
  待发送.清空(基准);
  window.dispatchEvent(new CustomEvent(待发送更新事件));
}
</script>

<style lang="scss" scoped>
@use '../滑块.scss' as 滑块;

.ls-readout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 16px 16px;
}

.ls-readout-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ls-readout-age {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.ls-readout-age-num {
  font-size: 30px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--ls-text);
  font-variant-numeric: tabular-nums;
}

.ls-readout-age-unit {
  font-size: 14px;
  color: var(--ls-text-muted);
}

.ls-readout-age-month {
  margin-left: 6px;
  font-size: 13px;
  color: var(--ls-text-faint);
  font-variant-numeric: tabular-nums;
}

.ls-readout-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ls-text-muted);
  font-variant-numeric: tabular-nums;
}

/* 窄列下整体换行，字段与它前后的分隔符不被拆开 */
.ls-readout-meta > * {
  white-space: nowrap;
}

.ls-readout-name {
  font-weight: 600;
  color: var(--ls-text);
}

.ls-readout-sep {
  color: var(--ls-border-strong);
}

.ls-readout-mode {
  margin-left: auto;
  padding: 3px 10px;
  font-size: 12px;
}

.ls-readout-span {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
  padding: 8px 12px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface-sunken);
}

.ls-readout-span-label {
  flex: none;
  font-size: 12.5px;
  color: var(--ls-text-muted);
}

.ls-readout-range {
  @include 滑块.滑块外观;
}

.ls-readout-span-value {
  flex: none;
  min-width: 52px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: var(--ls-text);
  font-variant-numeric: tabular-nums;
}

.ls-btn-quiet {
  flex: none;
  padding: 5px 12px;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text-body);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-btn-quiet:hover {
    background: var(--ls-surface-hover);
    border-color: var(--ls-text-faint);
    color: var(--ls-text);
  }
}
</style>
