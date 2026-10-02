<template>
  <div class="ls-panel">
    <OpeningPanel v-if="view === 'opening'" />

    <EndPanel v-else-if="view === 'end'" :finale="store.data.终章" />

    <div v-else-if="view === 'slow'" class="ls-card">
      <SlowPanel
        :time="store.data.时间"
        :vitals="store.data.状态"
        :focus="store.data.焦点"
        :studies="store.data.学识"
        :skills="store.data.技能"
        :relations="store.data.关系"
      />
    </div>

    <div v-else class="ls-card">
      <ReadoutBar :time="store.data.时间" :sex="store.data._性别" :name="store.data.姓名" />

      <PanelTabs v-model="active" :tabs="tabs">
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
      </PanelTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ArchivePanel from './components/ArchivePanel.vue';
import EndPanel from './components/EndPanel.vue';
import EventPanel from './components/EventPanel.vue';
import OpeningPanel from './components/OpeningPanel.vue';
import PanelTabs from './components/PanelTabs.vue';
import ReadoutBar from './components/ReadoutBar.vue';
import SkillPanel from './components/SkillPanel.vue';
import SlowPanel from './components/SlowPanel.vue';
import TalentPanel from './components/TalentPanel.vue';
import WishPanel from './components/WishPanel.vue';
import { useDataStore } from './store';

const store = useDataStore();

const TABS = [
  { key: 'event', label: '事件' },
  { key: 'archive', label: '档案' },
  { key: 'talent', label: '天赋' },
  { key: 'ability', label: '学识与技能' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const active = ref<TabKey>('event');

const eventCount = computed(() => Object.keys(store.data.事件 ?? {}).length);

// 事件页签带数量角标，其余不带
const tabs = computed(() =>
  TABS.map(tab => (tab.key === 'event' ? { ...tab, count: eventCount.value || undefined } : { ...tab })),
);

const view = computed(() => {
  if (store.data.终章.已结算) {
    return 'end';
  }
  if (store.data.时间.模式 === '分钟推进') {
    return 'slow';
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

@media (max-width: 480px) {
  .ls-card {
    border-radius: var(--ls-r-sm);
  }
}
</style>
