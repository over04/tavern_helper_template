<template>
  <nav class="ls-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="ls-tab"
      :class="{ 'ls-is-active': modelValue === tab.key }"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.key"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <span v-if="tab.count" class="ls-tab-count">{{ tab.count }}</span>
    </button>
  </nav>

  <div :key="modelValue" class="ls-tab-body">
    <slot />
  </div>
</template>

<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T;
  tabs: readonly { key: T; label: string; count?: number }[];
}>();

defineEmits<{ 'update:modelValue': [value: T] }>();
</script>

<style lang="scss" scoped>
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
  .ls-tabs {
    margin: 0 12px 4px;
  }
}
</style>
