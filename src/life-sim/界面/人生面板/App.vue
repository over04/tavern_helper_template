<template>
  <div class="panel">
    <OpeningPanel v-if="view === 'opening'" />

    <EndPanel v-else-if="view === 'end'" :finale="store.data.终章" />

    <div v-else class="card cl-enter-seq">
      <ReadoutBar :time="store.data.时间" :sex="store.data._性别" />

      <EventPanel :events="store.data.事件" />

      <WishPanel :wishes="store.data.心向" />

      <CollapsibleSection title="档案">
        <ArchivePanel
          :vitals="store.data.状态"
          :focus="store.data.焦点"
          :relations="store.data.关系"
          :family-assets="store.data.家庭资产"
          :personal-assets="store.data.个人资产"
        />
      </CollapsibleSection>

      <CollapsibleSection title="天赋">
        <TalentPanel :innate="store.data._先天" />
      </CollapsibleSection>

      <CollapsibleSection title="本事">
        <SkillPanel :studies="store.data.学识" :skills="store.data.技能" />
      </CollapsibleSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ArchivePanel from './components/ArchivePanel.vue';
import CollapsibleSection from './components/CollapsibleSection.vue';
import EndPanel from './components/EndPanel.vue';
import EventPanel from './components/EventPanel.vue';
import OpeningPanel from './components/OpeningPanel.vue';
import ReadoutBar from './components/ReadoutBar.vue';
import SkillPanel from './components/SkillPanel.vue';
import TalentPanel from './components/TalentPanel.vue';
import WishPanel from './components/WishPanel.vue';
import { useDataStore } from './store';

const store = useDataStore();

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

@media (max-width: 480px) {
  .card {
    border-radius: var(--r-sm);
  }
}
</style>
