<template>
  <section v-if="判定" class="ls-judge">
    <header class="ls-judge-head">
      <span class="ls-judge-event">{{ 判定.事件 }}</span>
      <span class="ls-judge-outcome" :data-outcome="判定.成败">{{ 判定.成败 }}</span>
    </header>

    <!-- 区间条按成功线切成四段，骰值标记落在哪一段就是什么结果，文字只留骰值本身 -->
    <div class="ls-judge-gauge">
      <div class="ls-judge-track">
        <span class="ls-seg" data-kind="大失败" :style="{ width: 段宽.大失败 + '%' }"></span>
        <span class="ls-seg" data-kind="失败" :style="{ width: 段宽.失败 + '%' }"></span>
        <span class="ls-seg" data-kind="成功" :style="{ width: 段宽.成功 + '%' }"></span>
        <span class="ls-seg" data-kind="大成功" :style="{ width: 段宽.大成功 + '%' }"></span>
      </div>
      <span class="ls-pin" :style="{ left: 判定.骰值 + '%' }">{{ 判定.骰值 }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from './store';

const props = defineProps<{ 位置: number }>();

const store = useDataStore();

// 两端区先判与成功线的判法见「判定」条目；界面不存难度表，数值全部取用变量。
function 判成败(骰值: number, 界线: number, 成功线: number, 方式: string) {
  if (方式 === '改判') {
    return '成功';
  }
  if (骰值 <= 界线) {
    return '大失败';
  }
  if (骰值 >= 101 - 界线) {
    return '大成功';
  }
  return 骰值 >= 成功线 ? '成功' : '失败';
}

const 判定 = computed(() => {
  const 条目 = (store.data.$参数?.本次判定 ?? [])[props.位置];
  if (!条目?.事件) {
    return null;
  }
  return {
    事件: 条目.事件,
    骰值: 条目.骰值,
    界线: 条目.界线,
    成功线: 条目.成功线,
    成败: 判成败(条目.骰值, 条目.界线, 条目.成功线, 条目.命运点),
  };
});

// 四段各自的宽度，合计恰好 100。骰值越大越好，所以失败段紧贴大失败区、成功段紧贴大成功区，
// 中间两段以成功线为界；成功线越出两端区时对应的一段宽度收缩为 0。
const 段宽 = computed(() => {
  // 界线合法值是 1~5，0 只可能是没写进来，用普通档兜底；成功线 0 是合法值（骰值必然不低于它），只能用 ?? 兜底
  const k = 判定.value?.界线 || 3;
  const s = 判定.value?.成功线 ?? 55;
  const 上限 = 100 - k;
  return {
    大失败: k,
    失败: Math.max(0, Math.min(s, 上限) - k),
    成功: Math.max(0, 上限 - Math.max(s, k)),
    大成功: k,
  };
});
</script>

<style lang="scss" scoped>
.ls-judge {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  width: 100%;
  max-width: 620px;
  margin: 0 auto 16px;
  padding: 16px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  background: var(--ls-surface);
  animation: ls-enter 0.4s var(--ls-ease-out) both;
}

.ls-judge-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 22px;
}

.ls-judge-event {
  font-size: 13px;
  color: var(--ls-text-body);
}

.ls-judge-outcome {
  margin-left: auto;
  padding: 1px 10px;
  border-radius: 999px;
  background: var(--ls-bg-alt);
  font-size: 12px;
  font-weight: 500;
  color: var(--ls-text-muted);
}

.ls-judge-outcome[data-outcome='大成功'],
.ls-judge-outcome[data-outcome='成功'] {
  color: var(--ls-positive);
}

.ls-judge-outcome[data-outcome='大失败'] {
  color: var(--ls-alarm);
}

/* 容器高度取徽章高度，条在其中垂直居中，徽章不会溢出到卡片的留白区 */
.ls-judge-gauge {
  position: relative;
  display: flex;
  align-items: center;
  height: 22px;
}

.ls-judge-track {
  display: flex;
  width: 100%;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--ls-bg-alt);
}

.ls-seg {
  height: 100%;
}

/* 四段各有颜色：两端区用深色语义色，中间两段用浅色，骰值落在哪一段一眼可辨 */
.ls-seg[data-kind='大失败'] {
  background: var(--ls-alarm);
  opacity: 0.55;
}

.ls-seg[data-kind='失败'] {
  background: var(--ls-border-strong);
}

.ls-seg[data-kind='成功'] {
  background: var(--ls-positive);
  opacity: 0.55;
}

.ls-seg[data-kind='大成功'] {
  background: var(--ls-positive);
}

/* 骰值做成骑在区间条上的胶囊徽章，用品牌橙，白描边把它与条分开 */
.ls-pin {
  position: absolute;
  top: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--ls-accent);
  color: #fff;
  font-family: var(--ls-f-mono);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 3px var(--ls-surface);
}

@media (max-width: 480px) {
  .ls-judge {
    gap: 16px;
    margin-bottom: 12px;
    padding: 11px 13px 14px;
    border-radius: var(--ls-r-sm);
  }
}
</style>
