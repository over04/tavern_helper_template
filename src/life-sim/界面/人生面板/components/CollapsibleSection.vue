<template>
  <section class="ls-fold">
    <button class="ls-fold-head" type="button" :aria-expanded="open" @click="open = !open">
      <span class="ls-fold-title">{{ title }}</span>
      <span v-if="meta" class="ls-fold-meta">{{ meta }}</span>
      <i class="fa-solid fa-chevron-down ls-fold-chevron" :class="{ 'ls-is-open': open }" />
    </button>
    <div class="ls-fold-body" :class="{ 'ls-is-open': open }">
      <div class="ls-fold-inner">
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
.ls-fold {
  border-top: 1px solid var(--ls-border);
}

.ls-fold-head {
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

.ls-fold-head:hover {
  background: var(--ls-surface-sunken);
}

.ls-fold-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ls-text);
}

.ls-fold-meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--ls-text-faint);
  font-variant-numeric: tabular-nums;
}

.ls-fold-chevron {
  font-size: 10px;
  color: var(--ls-text-faint);
  transition: transform 0.24s var(--ls-ease);
}

.ls-fold-chevron.ls-is-open {
  transform: rotate(180deg);
}

.ls-fold-body {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.26s var(--ls-ease), opacity 0.2s var(--ls-ease);
}

.ls-fold-body.ls-is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.ls-fold-inner {
  overflow: hidden;
}

.ls-fold-body.ls-is-open .ls-fold-inner > :deep(*) {
  animation: ls-reveal 0.28s var(--ls-ease-out) both;
}
</style>
