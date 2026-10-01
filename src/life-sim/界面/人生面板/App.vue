<template>
  <div class="panel">
    <OpeningPanel v-if="view === 'opening'" />

    <EndPanel v-else-if="view === 'end'" :finale="store.data.终章" />

    <div v-else class="card">
      <ReadoutBar :time="store.data.时间" :sex="store.data._性别" :name="store.data.姓名" />

      <nav class="tabs" role="tablist">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="tab"
          :class="{ 'is-active': active === tab.key }"
          type="button"
          role="tab"
          :aria-selected="active === tab.key"
          @click="active = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'event' && eventCount" class="tab-count">{{ eventCount }}</span>
        </button>
      </nav>

      <div :key="active" class="tab-body">
        <template v-if="active === 'event'">
          <EventPanel :events="store.data.事件" />
          <WishPanel :wishes="store.data.心向" />
        </template>

        <ArchivePanel
          v-else-if="active === 'archive'"
          :vitals="store.data.状态"
          :focus="store.data.焦点"
          :relations="store.data.关系"
          :family-assets="store.data.家庭资产"
          :personal-assets="store.data.个人资产"
        />

        <TalentPanel v-else-if="active === 'talent'" :innate="store.data._先天" />

        <SkillPanel v-else :studies="store.data.学识" :skills="store.data.技能" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ArchivePanel from './components/ArchivePanel.vue';
import EndPanel from './components/EndPanel.vue';
import EventPanel from './components/EventPanel.vue';
import OpeningPanel from './components/OpeningPanel.vue';
import ReadoutBar from './components/ReadoutBar.vue';
import SkillPanel from './components/SkillPanel.vue';
import TalentPanel from './components/TalentPanel.vue';
import WishPanel from './components/WishPanel.vue';
import { useDataStore } from './store';

const store = useDataStore();

const TABS = [
  { key: 'event', label: '事件' },
  { key: 'archive', label: '档案' },
  { key: 'talent', label: '天赋' },
  { key: 'ability', label: '本事' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const active = ref<TabKey>('event');

const eventCount = computed(() => Object.keys(store.data.事件 ?? {}).length);

const view = computed(() => {
  if (store.data.终章.已结算) {
    return 'end';
  }
  if (store.data.时间.回合 > 0) {
    return 'life';
  }
  return 'opening';
});
</script>

<style lang="scss" scoped>
.panel {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  box-sizing: border-box;
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  overflow: hidden;
  animation: cl-enter 0.5s var(--ease-out) both;
}

.tabs {
  display: flex;
  gap: 2px;
  margin: 0 16px 4px;
  padding: 3px;
  border-radius: var(--r-sm);
  background: var(--c-bg-alt);
}

.tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-text-muted);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

.tab:hover {
  color: var(--c-text);
}

.tab.is-active {
  background: var(--c-surface);
  color: var(--c-text);
  box-shadow: var(--shadow-hair);
}

.tab-count {
  padding: 0 5px;
  border-radius: 999px;
  background: var(--c-accent-soft);
  color: var(--c-accent-hover);
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.tab.is-active .tab-count {
  background: var(--c-accent);
  color: #fff;
}

.tab-body {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--c-border);
  animation: cl-reveal 0.3s var(--ease-out) both;
}

@media (max-width: 480px) {
  .card {
    border-radius: var(--r-sm);
  }

  .tabs {
    margin: 0 12px 4px;
  }
}
</style>
