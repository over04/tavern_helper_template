<template>
  <div class="ls-slow">
    <header class="ls-slow-head">
      <div class="ls-slow-clock">
        <span class="ls-slow-date">{{ dateLabel }}</span>
        <span class="ls-slow-time">{{ timeLabel }}</span>
      </div>
      <button class="ls-btn-quiet" type="button" @click="backToMonthly">回到月推进</button>
    </header>

    <p class="ls-slow-elapsed">慢速模式已过 {{ elapsedLabel }}</p>

    <PanelTabs v-model="active" :tabs="TABS">
      <div v-if="active === 'status'" class="ls-slow-body">
        <div class="ls-vitals">
          <RingProgress label="健康" :value="vitals.健康" :tone="hpTone" />
          <RingProgress label="气度" :value="vitals.气度" tone="neutral" />
          <RingProgress label="声望" :value="vitals.声望" tone="accent" />
          <RingProgress label="幸福" :value="vitals.幸福" tone="positive" />
        </div>

        <div class="ls-group">
          <span class="ls-group-label">精力</span>
          <FocusRing :focus="focus" />
        </div>
      </div>

      <SkillPanel v-else-if="active === 'ability'" :studies="studies" :skills="skills" />

      <div v-else class="ls-slow-body">
        <div class="ls-group">
          <span class="ls-group-label">关系</span>
          <div class="ls-rel-list">
            <RelationBar
              v-for="[name, rel] in relationEntries"
              :key="name"
              :name="name"
              :identity="rel.身份"
              :stage="rel.阶段"
              :value="rel.亲密度"
            />
          </div>
          <span v-if="!relationEntries.length" class="ls-empty">无</span>
        </div>
      </div>
    </PanelTabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '../store';
import { 切模式 } from '../待发送';
import FocusRing from './FocusRing.vue';
import PanelTabs from './PanelTabs.vue';
import RelationBar from './RelationBar.vue';
import RingProgress from './RingProgress.vue';
import SkillPanel from './SkillPanel.vue';

type Ability = { 层级: number; 进度: number; 上限: number; 类?: string; 教育质量?: number };

const store = useDataStore();

// 时间头常驻页签之外，时刻是慢速模式的核心信息
const TABS = [
  { key: 'status', label: '状态' },
  { key: 'ability', label: '学识与技能' },
  { key: 'relation', label: '关系' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const props = defineProps<{
  time: {
    年: number;
    月: number;
    日: number;
    时: number;
    分: number;
    慢速累计: number;
  };
  vitals: { 健康: number; 气度: number; 声望: number; 幸福: number };
  focus: Record<string, number>;
  studies: Record<string, Ability>;
  skills: Record<string, Ability>;
  relations: Record<string, { 身份: string; 阶段: string; 亲密度: number }>;
}>();

const active = ref<TabKey>('status');

const dateLabel = computed(() => {
  const { 年, 月, 日 } = props.time;
  return 日 > 0 ? `${年} 年 ${月} 月 ${日} 日` : `${年} 年 ${月} 月末`;
});

const timeLabel = computed(() => {
  const { 日, 时, 分 } = props.time;
  if (日 <= 0) {
    return '23:59';
  }
  return `${String(时).padStart(2, '0')}:${String(分).padStart(2, '0')}`;
});

const elapsedLabel = computed(() => {
  const total = Math.max(0, Math.round(Number(props.time.慢速累计) || 0));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} 天`);
  }
  if (hours > 0) {
    parts.push(`${hours} 小时`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} 分钟`);
  }
  return parts.join(' ');
});

const hpTone = computed(() => {
  const hp = props.vitals.健康;
  if (hp < 40) {
    return 'alarm' as const;
  }
  if (hp < 60) {
    return 'caution' as const;
  }
  return 'positive' as const;
});

const relationEntries = computed(() => Object.entries(props.relations ?? {}));

// 模式切换由界面直接改写变量，改完立即生效，下一次发送时附一次模式切换声明
function backToMonthly() {
  store.data.时间.模式 = '月推进';
  切模式('月推进');
}
</script>

<style lang="scss" scoped>
.ls-slow {
  display: flex;
  flex-direction: column;
}

.ls-slow-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 16px 0;
}

.ls-slow-clock {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.ls-slow-date {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ls-text);
  font-variant-numeric: tabular-nums;
}

.ls-slow-time {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ls-accent-hover);
  font-variant-numeric: tabular-nums;
}

.ls-slow-elapsed {
  padding: 6px 16px 14px;
  font-size: 12.5px;
  color: var(--ls-text-faint);
  font-variant-numeric: tabular-nums;
}

.ls-slow-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px;
}

.ls-vitals {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ls-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.ls-group-label {
  font-size: 12px;
  color: var(--ls-text-faint);
}

.ls-rel-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.ls-empty {
  font-size: 12.5px;
  color: var(--ls-text-faint);
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
