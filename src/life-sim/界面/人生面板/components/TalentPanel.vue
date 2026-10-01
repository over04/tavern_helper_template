<template>
  <div class="ls-talent">
    <RadarChart :values="entries" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import RadarChart from './RadarChart.vue';

const props = defineProps<{
  innate: Record<string, number>;
}>();

const entries = computed(() =>
  Object.entries(props.innate ?? {}).map(([label, value]) => ({ label, value })),
);
</script>

<style lang="scss" scoped>
.ls-talent {
  display: flex;
  flex-direction: column;
}
</style>
