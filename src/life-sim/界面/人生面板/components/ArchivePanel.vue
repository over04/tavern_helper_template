<template>
  <div class="archive">
    <div class="archive-meters">
      <MeterBar label="健康" :value="vitals.健康" :tone="hpTone" />
      <MeterBar label="气度" :value="vitals.气度" tone="neutral" />
      <MeterBar label="声望" :value="vitals.声望" tone="accent" />
      <MeterBar label="幸福" :value="vitals.幸福" tone="positive" />
    </div>

    <div class="group">
      <span class="group-label">精力</span>
      <div class="row">
        <span v-for="[field, share] in focusEntries" :key="field" class="tag is-accent">
          {{ field }}<b>{{ share }}</b>
        </span>
        <span v-if="!focusEntries.length" class="empty">未分配</span>
      </div>
    </div>

    <div class="group">
      <span class="group-label">关系</span>
      <div class="row">
        <span v-for="[name, rel] in relationEntries" :key="name" class="tag">
          {{ name }}<em>{{ rel.身份 }} · {{ rel.阶段 }}</em>
          <b :class="{ 'is-neg': rel.亲密度 < 0 }">{{ rel.亲密度 }}</b>
        </span>
        <span v-if="!relationEntries.length" class="empty">无</span>
      </div>
    </div>

    <div class="group">
      <span class="group-label">资产</span>
      <div class="assets">
        <template v-if="familyEntries.length">
          <span class="asset-tag">家庭</span>
          <div v-for="[name, item] in familyEntries" :key="name" class="asset-row">
            <b>{{ name }}</b>
            <span>{{ item.数量 }}</span>
            <em>{{ item.来源 }}</em>
          </div>
        </template>
        <template v-if="personalEntries.length">
          <span class="asset-tag">个人</span>
          <div v-for="[name, item] in personalEntries" :key="name" class="asset-row">
            <b>{{ name }}</b>
            <span>{{ item.数量 }}</span>
            <em>{{ item.来源 }}</em>
          </div>
        </template>
        <span v-if="!familyEntries.length && !personalEntries.length" class="empty">无</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MeterBar from './MeterBar.vue';

const props = defineProps<{
  vitals: { 健康: number; 气度: number; 声望: number; 幸福: number };
  focus: Record<string, number>;
  relations: Record<string, { 身份: string; 阶段: string; 亲密度: number }>;
  familyAssets: Record<string, { 数量: string; 来源: string }>;
  personalAssets: Record<string, { 数量: string; 来源: string }>;
}>();

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

const focusEntries = computed(() => Object.entries(props.focus ?? {}));
const relationEntries = computed(() => Object.entries(props.relations ?? {}));
const familyEntries = computed(() => Object.entries(props.familyAssets ?? {}));
const personalEntries = computed(() => Object.entries(props.personalAssets ?? {}));
</script>

<style lang="scss" scoped>
.archive {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 14px 16px 16px;
}

.archive-meters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px 18px;
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

.tag {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 11px;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  background: var(--c-surface-sunken);
  font-size: 12.5px;
  color: var(--c-text-body);
}

.tag.is-accent {
  border-color: var(--c-accent-line);
  background: var(--c-accent-soft);
}

.tag em {
  font-style: normal;
  font-size: 11px;
  color: var(--c-text-faint);
}

.tag b {
  font-weight: 600;
  color: var(--c-accent-hover);
  font-variant-numeric: tabular-nums;
}

.tag b.is-neg {
  color: var(--c-alarm);
}

.empty {
  font-size: 12.5px;
  color: var(--c-text-faint);
}

.assets {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.asset-tag {
  margin-top: 4px;
  font-size: 11.5px;
  color: var(--c-text-faint);
}

.asset-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12.5px;
}

.asset-row b {
  flex: none;
  font-weight: 500;
  color: var(--c-text);
}

.asset-row span {
  color: var(--c-text-body);
}

.asset-row em {
  font-style: normal;
  font-size: 11.5px;
  color: var(--c-text-faint);
}
</style>
