<template>
  <div class="ls-skills">
    <div class="ls-group">
      <span class="ls-group-label">学识</span>
      <CollapsibleList class="ls-skill-list" :items="studyEntries" :limit="5">
        <template #default="{ items }">
          <LevelBar
            v-for="[name, item] in items"
            :key="name"
            :name="name"
            :层级="item.层级"
            :进度="item.进度"
            :上限="item.上限"
            :类="item.类"
            :教育质量="item.教育质量"
          />
        </template>
      </CollapsibleList>
      <div v-if="!studyEntries.length" class="ls-ghost">
        <span class="ls-ghost-note">尚未习得</span>
        <div class="ls-ghost-track">
          <span v-for="cell in GHOST_CELLS" :key="cell" class="ls-ghost-cell" />
        </div>
      </div>
    </div>

    <div class="ls-group">
      <span class="ls-group-label">技能</span>
      <CollapsibleList class="ls-skill-list" :items="skillEntries" :limit="5">
        <template #default="{ items }">
          <LevelBar
            v-for="[name, item] in items"
            :key="name"
            :name="name"
            :层级="item.层级"
            :进度="item.进度"
            :上限="item.上限"
            :类="item.类"
            :教育质量="item.教育质量"
          />
        </template>
      </CollapsibleList>
      <div v-if="!skillEntries.length" class="ls-ghost">
        <span class="ls-ghost-note">尚未习得</span>
        <div class="ls-ghost-track">
          <span v-for="cell in GHOST_CELLS" :key="cell" class="ls-ghost-cell" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CollapsibleList from './CollapsibleList.vue';
import LevelBar from './LevelBar.vue';

type Ability = { 层级: number; 进度: number; 上限: number; 类?: string; 教育质量?: number };

// 空态占位槽的格数，与 LevelBar 的刻度格保持一致
const GHOST_CELLS = 10;

const props = defineProps<{
  studies: Record<string, Ability>;
  skills: Record<string, Ability>;
}>();

const studyEntries = computed(() => Object.entries(props.studies ?? {}));
const skillEntries = computed(() => Object.entries(props.skills ?? {}));
</script>

<style lang="scss" scoped>
.ls-skills {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
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

.ls-skill-list {
  --ls-collapse-gap: 11px;
}

.ls-ghost {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ls-ghost-note {
  font-size: 12.5px;
  color: var(--ls-text-faint);
}

.ls-ghost-track {
  display: flex;
  gap: 3px;
  height: 6px;
}

.ls-ghost-cell {
  flex: 1;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px var(--ls-border);
}
</style>
