<template>
  <div class="skills">
    <div class="group">
      <span class="group-label">学识</span>
      <CollapsibleList class="skill-list" :items="studyEntries" :limit="5">
        <template #default="{ items }">
          <LevelBar
            v-for="[name, item] in items"
            :key="name"
            :name="name"
            :层级="item.层级"
            :进度="item.进度"
            :上限="item.上限"
          />
        </template>
      </CollapsibleList>
      <span v-if="!studyEntries.length" class="empty">无</span>
    </div>

    <div class="group">
      <span class="group-label">技能</span>
      <CollapsibleList class="skill-list" :items="skillEntries" :limit="5">
        <template #default="{ items }">
          <LevelBar
            v-for="[name, item] in items"
            :key="name"
            :name="name"
            :层级="item.层级"
            :进度="item.进度"
            :上限="item.上限"
          />
        </template>
      </CollapsibleList>
      <span v-if="!skillEntries.length" class="empty">无</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CollapsibleList from './CollapsibleList.vue';
import LevelBar from './LevelBar.vue';

type Ability = { 层级: number; 进度: number; 上限: number };

const props = defineProps<{
  studies: Record<string, Ability>;
  skills: Record<string, Ability>;
}>();

const studyEntries = computed(() => Object.entries(props.studies ?? {}));
const skillEntries = computed(() => Object.entries(props.skills ?? {}));
</script>

<style lang="scss" scoped>
.skills {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.group-label {
  font-size: 12px;
  color: var(--c-text-faint);
}

.skill-list {
  --collapse-gap: 11px;
}

.empty {
  font-size: 12.5px;
  color: var(--c-text-faint);
}
</style>
