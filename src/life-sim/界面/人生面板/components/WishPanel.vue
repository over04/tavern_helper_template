<template>
  <section v-if="wishes.length" class="wishes">
    <span class="wishes-label">心向</span>
    <div class="wishes-row">
      <button v-for="(wish, index) in wishes" :key="`${wish}-${index}`" class="wish" type="button" @click="pick(wish)">
        {{ wish }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { injectInput } from '../inject';

defineProps<{
  wishes: string[];
}>();

function pick(wish: string) {
  injectInput(`「心向」：${wish}`);
}
</script>

<style lang="scss" scoped>
.wishes {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 16px 15px;
  border-top: 1px solid var(--c-border);
}

.wishes-label {
  flex: none;
  padding-top: 4px;
  font-size: 12px;
  color: var(--c-text-faint);
}

.wishes-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wish {
  padding: 4px 12px;
  border: 1px solid var(--c-border-strong);
  border-radius: 999px;
  background: var(--c-surface);
  color: var(--c-text-body);
  font-size: 12.5px;
  cursor: pointer;
}

.wish:hover {
  background: var(--c-accent-soft);
  border-color: var(--c-accent-line);
  color: var(--c-accent-hover);
}
</style>
