<template>
  <div class="skills">
    <div class="group">
      <span class="group-label">学识</span>
      <div class="row">
        <span v-for="[name, item] in studyEntries" :key="name" class="skill">
          <span class="skill-name">{{ name }}</span>
          <span class="skill-level">L{{ item.层级 }}</span>
          <span class="skill-pct">{{ item.进度 }}%</span>
          <span class="skill-cap">上限 {{ item.上限 }}</span>
        </span>
        <span v-if="!studyEntries.length" class="empty">无</span>
      </div>
    </div>

    <div class="group">
      <span class="group-label">技能</span>
      <div class="row">
        <span v-for="[name, item] in skillEntries" :key="name" class="skill">
          <span class="skill-name">{{ name }}</span>
          <span class="skill-level">L{{ item.层级 }}</span>
          <span class="skill-pct">{{ item.进度 }}%</span>
          <span class="skill-cap">上限 {{ item.上限 }}</span>
        </span>
        <span v-if="!skillEntries.length" class="empty">无</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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
  gap: 14px;
  padding: 14px 16px 16px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.group-label {
  font-size: 12px;
  color: var(--c-text-faint);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  padding: 5px 11px;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  background: var(--c-surface-sunken);
  font-size: 12.5px;
}

.skill:hover {
  border-color: var(--c-accent-line);
  background: var(--c-accent-soft);
}

.skill-name {
  color: var(--c-text);
}

.skill-level {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-accent-hover);
  font-variant-numeric: tabular-nums;
}

.skill-pct {
  font-size: 11.5px;
  color: var(--c-text-muted);
  font-variant-numeric: tabular-nums;
}

.skill-cap {
  font-size: 11px;
  color: var(--c-text-faint);
}

.empty {
  font-size: 12.5px;
  color: var(--c-text-faint);
}
</style>
