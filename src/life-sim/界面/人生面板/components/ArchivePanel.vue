<template>
  <div class="ls-archive">
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

    <div class="ls-group">
      <span class="ls-group-label">关系</span>
      <CollapsibleList class="ls-rel-list" :items="relationEntries" :limit="5">
        <template #default="{ items }">
          <RelationBar
            v-for="[name, rel] in items"
            :key="name"
            :name="name"
            :identity="rel.身份"
            :stage="rel.阶段"
            :value="rel.亲密度"
          />
        </template>
      </CollapsibleList>
      <span v-if="!relationEntries.length" class="ls-empty">无</span>
    </div>

    <div class="ls-group">
      <span class="ls-group-label">资产</span>
      <div class="ls-asset-groups">
        <div v-if="familyEntries.length" class="ls-asset-group">
          <span class="ls-asset-group-label">家庭</span>
          <CollapsibleList :items="familyEntries" :limit="5">
            <template #default="{ items }">
              <div v-for="[name, item] in items" :key="name" class="ls-asset-row">
                <div class="ls-asset-info">
                  <span class="ls-asset-name">{{ name }}</span>
                  <span v-if="item.来源" class="ls-asset-source">{{ item.来源 }}</span>
                </div>
                <span class="ls-asset-amount">{{ item.数量 }}</span>
              </div>
            </template>
          </CollapsibleList>
        </div>

        <div v-if="personalEntries.length" class="ls-asset-group">
          <span class="ls-asset-group-label">个人</span>
          <CollapsibleList :items="personalEntries" :limit="5">
            <template #default="{ items }">
              <div v-for="[name, item] in items" :key="name" class="ls-asset-row">
                <div class="ls-asset-info">
                  <span class="ls-asset-name">{{ name }}</span>
                  <span v-if="item.来源" class="ls-asset-source">{{ item.来源 }}</span>
                </div>
                <span class="ls-asset-amount">{{ item.数量 }}</span>
              </div>
            </template>
          </CollapsibleList>
        </div>

        <span v-if="!familyEntries.length && !personalEntries.length" class="ls-empty">无</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CollapsibleList from './CollapsibleList.vue';
import FocusRing from './FocusRing.vue';
import RelationBar from './RelationBar.vue';
import RingProgress from './RingProgress.vue';

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

const relationEntries = computed(() => Object.entries(props.relations ?? {}));
const familyEntries = computed(() => Object.entries(props.familyAssets ?? {}));
const personalEntries = computed(() => Object.entries(props.personalAssets ?? {}));
</script>

<style lang="scss" scoped>
.ls-archive {
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
  --ls-collapse-gap: 11px;
}

.ls-empty {
  font-size: 12.5px;
  color: var(--ls-text-faint);
}

.ls-asset-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ls-asset-group {
  display: flex;
  flex-direction: column;
  padding: 6px 12px 8px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface-sunken);
}

.ls-asset-group-label {
  padding: 4px 0 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--ls-text-faint);
}

.ls-asset-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 9px 0;
  border-top: 1px solid var(--ls-border);
}

.ls-asset-row:first-child {
  border-top: none;
}

.ls-asset-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ls-asset-name {
  font-size: 13px;
  color: var(--ls-text);
}

.ls-asset-source {
  font-size: 11.5px;
  color: var(--ls-text-faint);
}

.ls-asset-amount {
  margin-left: auto;
  flex: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-accent-hover);
  font-variant-numeric: tabular-nums;
}
</style>
