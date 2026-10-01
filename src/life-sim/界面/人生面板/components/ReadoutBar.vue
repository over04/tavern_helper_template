<template>
  <header class="readout">
    <div class="readout-top">
      <div class="readout-age">
        <span class="readout-age-num">{{ time.年龄岁 }}</span>
        <span class="readout-age-unit">岁</span>
        <span v-if="time.年龄月 > 0" class="readout-age-month">{{ time.年龄月 }} 个月</span>
      </div>
      <AgeRing :age-year="time.年龄岁" :age-month="time.年龄月" />
    </div>

    <div class="readout-meta">
      <template v-if="displayName">
        <span class="readout-name">{{ displayName }}</span>
        <span class="readout-sep">·</span>
      </template>
      <span>第 {{ time.回合 }} 回合</span>
      <span class="readout-sep">·</span>
      <span>{{ spanLabel }}</span>
      <span class="readout-sep">·</span>
      <span>{{ sex }}</span>
    </div>

    <div class="readout-span">
      <span class="readout-span-label">跨度</span>
      <input v-model.number="span" class="readout-range" type="range" min="1" max="60" step="1" />
      <span class="readout-span-value">{{ span }} 个月</span>
      <button class="btn-quiet" type="button" @click="applySpan">应用</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useDataStore } from '../store';
import AgeRing from './AgeRing.vue';

const store = useDataStore();

const props = defineProps<{
  time: { 回合: number; 年: number; 月: number; 跨度: number; 年龄岁: number; 年龄月: number; 阶段: string };
  sex: string;
  name: string;
}>();

// 变量 `姓名` 为空时，退回酒馆 persona 名（{{user}} 宏）
const personaName = ref('');

onMounted(() => {
  try {
    const api = (globalThis as { SillyTavern?: { substituteParams?: (text: string) => unknown } }).SillyTavern;
    const value = api?.substituteParams?.('{{user}}');
    if (typeof value === 'string' && value && value !== '{{user}}') {
      personaName.value = value;
    }
  } catch {
    personaName.value = '';
  }
});

const displayName = computed(() => props.name?.trim() || personaName.value);

const span = ref(props.time.跨度);

// 年/月 是回合结束时的读数，往前推 (跨度 - 1) 个月得到起点
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
</script>

<style lang="scss" scoped>
.readout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 16px 16px;
}

.readout-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.readout-age {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.readout-age-num {
  font-size: 30px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}

.readout-age-unit {
  font-size: 14px;
  color: var(--c-text-muted);
}

.readout-age-month {
  margin-left: 6px;
  font-size: 13px;
  color: var(--c-text-faint);
  font-variant-numeric: tabular-nums;
}

.readout-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--c-text-muted);
  font-variant-numeric: tabular-nums;
}

.readout-name {
  font-weight: 600;
  color: var(--c-text);
}

.readout-sep {
  color: var(--c-border-strong);
}

.readout-span {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
  padding: 8px 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  background: var(--c-surface-sunken);
}

.readout-span-label {
  flex: none;
  font-size: 12.5px;
  color: var(--c-text-muted);
}

.readout-range {
  flex: 1;
  min-width: 0;
  height: 4px;
  appearance: none;
  border-radius: 999px;
  background: var(--c-border-strong);
  outline: none;
  cursor: pointer;
}

.readout-range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--c-accent);
  border: 2px solid var(--c-surface);
  box-shadow: var(--shadow-hair);
}

.readout-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--c-accent);
  border: 2px solid var(--c-surface);
}

.readout-span-value {
  flex: none;
  min-width: 52px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}

.btn-quiet {
  flex: none;
  padding: 5px 12px;
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-sm);
  background: var(--c-surface);
  color: var(--c-text-body);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

.btn-quiet:hover {
  background: var(--c-surface-hover);
  border-color: var(--c-text-faint);
  color: var(--c-text);
}
</style>
