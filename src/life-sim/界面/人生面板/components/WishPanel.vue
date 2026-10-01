<template>
  <section v-if="wishes.length" class="ls-wishes">
    <span class="ls-wishes-label">心向</span>
    <div class="ls-wishes-row">
      <button v-for="(wish, index) in wishes" :key="`${wish}-${index}`" class="ls-wish" type="button" @click="pick(wish)">
        {{ wish }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { appendInput } from '../inject';

defineProps<{
  wishes: string[];
}>();

function pick(wish: string) {
  appendInput(`「心向」：${wish}`);
}
</script>

<style lang="scss" scoped>
.ls-wishes {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 16px 15px;
  border-top: 1px solid var(--ls-border);
}

.ls-wishes-label {
  flex: none;
  padding-top: 4px;
  font-size: 12px;
  color: var(--ls-text-faint);
}

.ls-wishes-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ls-wish {
  padding: 4px 12px;
  border: 1px solid var(--ls-border-strong);
  border-radius: 999px;
  background: var(--ls-surface);
  color: var(--ls-text-body);
  font-size: 12.5px;
  cursor: pointer;
}

.ls-wish:hover {
  background: var(--ls-accent-soft);
  border-color: var(--ls-accent-line);
  color: var(--ls-accent-hover);
}
</style>
