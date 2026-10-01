<template>
  <section class="fold">
    <button class="fold-head" type="button" :aria-expanded="open" @click="open = !open">
      <span class="fold-title">{{ title }}</span>
      <span v-if="meta" class="fold-meta">{{ meta }}</span>
      <i class="fa-solid fa-chevron-down fold-chevron" :class="{ 'is-open': open }" />
    </button>
    <div class="fold-body" :class="{ 'is-open': open }">
      <div class="fold-inner">
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

withDefaults(defineProps<{ title: string; meta?: string }>(), { meta: '' });

const open = ref(true);
</script>

<style lang="scss" scoped>
.fold {
  border-top: 1px solid var(--c-border);
}

.fold-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}

.fold-head:hover {
  background: var(--c-surface-sunken);
}

.fold-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text);
}

.fold-meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--c-text-faint);
  font-variant-numeric: tabular-nums;
}

.fold-chevron {
  font-size: 10px;
  color: var(--c-text-faint);
  transition: transform 0.24s var(--ease);
}

.fold-chevron.is-open {
  transform: rotate(180deg);
}

.fold-body {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.26s var(--ease), opacity 0.2s var(--ease);
}

.fold-body.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.fold-inner {
  overflow: hidden;
}

.fold-body.is-open .fold-inner > :deep(*) {
  animation: cl-reveal 0.28s var(--ease-out) both;
}
</style>
