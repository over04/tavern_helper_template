<template>
  <section v-if="判定" class="ls-judge">
    <header class="ls-judge-head">
      <span class="ls-judge-event">{{ 判定.事件 }}</span>
      <span class="ls-judge-outcome" :data-outcome="判定.成败">{{ 判定.成败 }}</span>
    </header>

    <!-- 区间条按成功线切成四段，骰值徽章落在哪一段就是什么结果，文字只留骰值本身 -->
    <div class="ls-judge-gauge">
      <div v-if="判定.命运点 || 判定.复核" class="ls-judge-marks">
        <span
          v-if="判定.命运点"
          class="ls-judge-mark ls-is-fate"
          :title="命运点说明[判定.命运点] ?? '命运点'"
        ></span>
        <span v-if="判定.复核" class="ls-judge-mark ls-is-review" :title="`复核：${判定.复核}`"></span>
      </div>

      <div class="ls-judge-track">
        <span class="ls-seg" data-kind="大失败" :style="{ width: 段宽.大失败 + '%' }"></span>
        <span class="ls-seg" data-kind="失败" :style="{ width: 段宽.失败 + '%' }"></span>
        <span class="ls-seg" data-kind="成功" :style="{ width: 段宽.成功 + '%' }"></span>
        <span class="ls-seg" data-kind="大成功" :style="{ width: 段宽.大成功 + '%' }"></span>
      </div>

      <span class="ls-pin" :style="{ left: 判定.骰值 + '%' }">{{ 判定.骰值 }}</span>
    </div>
  </section>

  <!-- 取不到判定数据时不留空白：把定位到的楼层与读到的字段状况写出来，一眼能看出断在哪一环 -->
  <section v-else class="ls-judge ls-judge-空">
    <span class="ls-judge-空-标题">本回合没有判定数据</span>
    <span class="ls-judge-空-明细">{{ 诊断 }}</span>
  </section>
</template>

<script setup lang="ts">
import { 读快照, 楼层上下文键 } from '../正文';

const props = defineProps<{ 序号: number }>();

// 判定条脚本提供所在楼层；没有它就没有可以取判定数据的楼层，整块退到诊断提示
const 楼层上下文 = inject(楼层上下文键, null);

const 命运点说明: Record<string, string> = {
  重掷: '命运点：重掷',
  加值: '命运点：加值 +20',
  改判: '命运点：改判为成功',
};

// 所在楼层的变量快照，判定与诊断共用，只取一次
const 快照 = computed(() => {
  const 楼层号 = 楼层上下文?.楼层.value?.楼层号;
  return 楼层号 === undefined ? null : 读快照(楼层号);
});

const 判定 = computed(() => {
  const 条目 = 快照.value?.$参数?.本次判定?.[props.序号 - 1];
  if (!条目?.事件) {
    return null;
  }

  const 骰值 = Number(条目.骰值) || 0;
  const 界线 = Number(条目.界线) || 0;
  const 成功线 = Number(条目.成功线) || 0;
  const 命运点 = String(条目.命运点 ?? '');

  return {
    事件: String(条目.事件),
    骰值,
    界线,
    成功线,
    命运点,
    复核: String(条目.复核 ?? ''),
    成败: String(条目.结果 ?? ''),
  };
});

// 判定为空时说明断在哪一环：楼层没定位到、快照读不到，还是本次判定这个字段本身不成形
const 诊断 = computed(() => {
  const 楼层号 = 楼层上下文?.楼层.value?.楼层号;
  if (楼层号 === undefined) {
    return '未定位到所在楼层';
  }
  if (!快照.value) {
    return `楼层 ${楼层号}：读不到变量快照`;
  }
  const 表 = 快照.value.$参数?.本次判定;
  const 形态 = Array.isArray(表) ? `长度 ${表.length}` : 表 === undefined ? '字段不存在' : '不是数组';
  return `楼层 ${楼层号} · 第 ${props.序号} 条 · 本次判定 ${形态}`;
});

// 四段各自的宽度，合计恰好 100。骰值越大越好，所以失败段紧贴大失败区、成功段紧贴大成功区，
// 中间两段以成功线为界；成功线越出两端区时对应的一段宽度收缩为 0。
const 段宽 = computed(() => {
  // 界线与成功线由 schema 的 prefault 给出默认值，由判定复核脚本写入，界面不再各存一份难度表
  const k = Number(判定.value?.界线 ?? 0);
  const s = Number(判定.value?.成功线 ?? 0);
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

/* 空态：只占一行，虚线描边配最轻的文字，与正常判定条区分开，也不喧宾夺主 */
.ls-judge-空 {
  gap: 3px;
  padding: 9px 13px;
  border-style: dashed;
  background: var(--ls-surface-sunken);
}

.ls-judge-空-标题 {
  font-size: 12.5px;
  color: var(--ls-text-muted);
}

.ls-judge-空-明细 {
  font-family: var(--ls-f-mono);
  font-size: 11.5px;
  color: var(--ls-text-faint);
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

/* 骰值做成叠在区间条上的胶囊徽章，用品牌橙，白描边把它与条分开 */
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

/* 命运点与复核各留一个小标记，落在区间条上方的空隙里，悬停给出说明 */
.ls-judge-marks {
  position: absolute;
  top: -13px;
  right: 2px;
  display: flex;
  gap: 5px;
}

.ls-judge-mark {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  cursor: help;
}

.ls-judge-mark.ls-is-fate {
  background: var(--ls-caution);
}

.ls-judge-mark.ls-is-review {
  background: var(--ls-alarm);
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
