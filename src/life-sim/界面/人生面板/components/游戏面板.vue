<template>
  <div class="ls-game">
    <div class="ls-game-体" :class="{ 'ls-card': 需要卡片 }">
      <EndPanel v-if="视图 === '终章'" :finale="数据.终章" />

      <div v-else-if="视图 === '分钟推进'">
        <SlowPanel
          :time="数据.时间"
          :vitals="数据.状态"
          :focus="数据.焦点"
          :studies="数据.学识"
          :skills="数据.技能"
          :relations="数据.关系"
        />
      </div>

      <template v-else-if="视图 === '月推进'">
        <div>
          <ReadoutBar :time="数据.时间" :sex="数据._性别" :name="数据.姓名" />
        </div>

        <PanelTabs v-model="active" :tabs="tabs">
          <template v-if="active === 'event'">
            <EventPanel :events="数据.事件" :fate="数据.命运点" />
            <WishPanel :wishes="数据.心向" />
          </template>

          <ArchivePanel
            v-else-if="active === 'archive'"
            :vitals="数据.状态"
            :focus="数据.焦点"
            :relations="数据.关系"
            :family-assets="数据.家庭资产"
            :personal-assets="数据.个人资产"
          />

          <TalentPanel v-else-if="active === 'talent'" :innate="数据._先天" />

          <SkillPanel v-else :studies="数据.学识" :skills="数据.技能" />
        </PanelTabs>
      </template>

      <OpeningPanel v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import ArchivePanel from './ArchivePanel.vue';
import EndPanel from './EndPanel.vue';
import EventPanel from './EventPanel.vue';
import OpeningPanel from './OpeningPanel.vue';
import PanelTabs from './PanelTabs.vue';
import ReadoutBar from './ReadoutBar.vue';
import SkillPanel from './SkillPanel.vue';
import SlowPanel from './SlowPanel.vue';
import TalentPanel from './TalentPanel.vue';
import WishPanel from './WishPanel.vue';
import { useDataStore } from '../store';
import { 视图键 } from '../视图';

const store = useDataStore();

// 面板始终操作当前楼层的变量
const 数据 = computed(() => store.data);

const TABS = [
  { key: 'event', label: '事件' },
  { key: 'archive', label: '档案' },
  { key: 'talent', label: '天赋' },
  { key: 'ability', label: '学识与技能' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const active = ref<TabKey>('event');

const eventCount = computed(() => Object.keys(数据.value.事件 ?? {}).length);

// 事件页签带数量角标，其余不带
const tabs = computed(() =>
  TABS.map(tab => (tab.key === 'event' ? { ...tab, count: eventCount.value || undefined } : { ...tab })),
);

// 视图由 App.vue 统一判断后注入，这里不再自己算一份，避免两处规则不一致
const 视图 = inject(视图键, ref('开局'));

// 开局视图与终章结算自带纸面，不再套一层卡片
const 需要卡片 = computed(() => 视图.value === '月推进' || 视图.value === '分钟推进');
</script>

<style lang="scss" scoped>
.ls-game {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.ls-game-体 {
  display: flex;
  flex-direction: column;
}

.ls-card {
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
