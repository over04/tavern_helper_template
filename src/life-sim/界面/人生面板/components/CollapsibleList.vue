<template>
  <div class="ls-collapse">
    <slot :items="visibleItems" />
    <button v-if="hasMore" class="ls-collapse-toggle" type="button" @click="expanded = !expanded">
      {{ expanded ? '收起' : `展开全部（还有 ${hiddenCount} 个）` }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    items: readonly T[];
    limit?: number;
  }>(),
  { limit: 5 },
);

const expanded = ref(false);

const visibleItems = computed(() => (expanded.value ? props.items : props.items.slice(0, props.limit)));
const hiddenCount = computed(() => Math.max(0, props.items.length - props.limit));
const hasMore = computed(() => props.items.length > props.limit);
</script>

<style lang="scss" scoped>
.ls-collapse {
  display: flex;
  flex-direction: column;
  gap: var(--ls-collapse-gap, 0px);
}

.ls-collapse-toggle {
  margin-top: 10px;
  padding: 8px 0;
  border: 1px dashed var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 12px;
  cursor: pointer;
}

.ls-collapse-toggle:hover {
  border-color: var(--ls-accent-line);
  background: var(--ls-accent-soft);
  color: var(--ls-accent-hover);
}
</style>
