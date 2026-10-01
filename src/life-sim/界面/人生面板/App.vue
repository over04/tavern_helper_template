<template>
  <div class="ls-panel">
    <OpeningPanel v-if="view === 'opening'" />

    <EndPanel v-else-if="view === 'end'" :finale="store.data.终章" />

    <div v-else class="ls-card">
      <ReadoutBar :time="store.data.时间" :sex="store.data._性别" :name="store.data.姓名" />

      <nav class="ls-tabs" role="tablist">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="ls-tab"
          :class="{ 'ls-is-active': active === tab.key }"
          type="button"
          role="tab"
          :aria-selected="active === tab.key"
          @click="active = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'event' && eventCount" class="ls-tab-count">{{ eventCount }}</span>
        </button>
      </nav>

      <div :key="active" class="ls-tab-body">
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
.ls-panel {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  box-sizing: border-box;
}

.ls-card {
  display: flex;
  flex-direction: column;
  background: var(--ls-surface);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  overflow: hidden;
  animation: ls-enter 0.5s var(--ls-ease-out) both;
}

.ls-tabs {
  display: flex;
  gap: 2px;
  margin: 0 16px 4px;
  padding: 3px;
  border-radius: var(--ls-r-sm);
  background: var(--ls-bg-alt);
}

.ls-tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

.ls-tab:hover {
  color: var(--ls-text);
}

.ls-tab.ls-is-active {
  background: var(--ls-surface);
  color: var(--ls-text);
  box-shadow: var(--ls-shadow-hair);
}

.ls-tab-count {
  padding: 0 5px;
  border-radius: 999px;
  background: var(--ls-accent-soft);
  color: var(--ls-accent-hover);
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.ls-tab.ls-is-active .ls-tab-count {
  background: var(--ls-accent);
  color: #fff;
}

.ls-tab-body {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--ls-border);
  animation: ls-reveal 0.3s var(--ls-ease-out) both;
}

@media (max-width: 480px) {
  .ls-card {
    border-radius: var(--ls-r-sm);
  }

  .ls-tabs {
    margin: 0 12px 4px;
  }
}
</style>
