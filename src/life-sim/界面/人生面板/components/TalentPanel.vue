<template>
  <div class="talent">
    <MeterBar v-for="[name, score] in entries" :key="name" :label="name" :value="score" tone="accent" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MeterBar from './MeterBar.vue';

const props = defineProps<{
  innate: Record<string, number>;
}>();

const entries = computed(() => Object.entries(props.innate ?? {}));
</script>

<style lang="scss" scoped>
.talent {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px 18px;
  padding: 14px 16px 16px;
}
</style>
