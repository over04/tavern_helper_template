<template>
  <div class="rel">
    <div class="rel-head">
      <span class="rel-name">{{ name }}</span>
      <span class="rel-tag">{{ identity }} · {{ stage }}</span>
      <span class="rel-value" :class="{ 'is-neg': value < 0 }">{{ value }}</span>
    </div>
    <div class="rel-track">
      <span class="rel-axis" />
      <span class="rel-fill" :class="{ 'is-neg': value < 0 }" :style="fillStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  identity: string;
  stage: string;
  value: number;
}>();

const fillStyle = computed(() => {
  const clamped = Math.max(-100, Math.min(100, props.value));
  const width = `${Math.abs(clamped) / 2}%`;
  return clamped >= 0 ? { left: '50%', width } : { right: '50%', width };
});
</script>

<style lang="scss" scoped>
.rel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rel-head {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.rel-name {
  font-size: 13px;
  color: var(--c-text);
}

.rel-tag {
  font-size: 11.5px;
  color: var(--c-text-faint);
}

.rel-value {
  margin-left: auto;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--c-accent-hover);
  font-variant-numeric: tabular-nums;
}

.rel-value.is-neg {
  color: var(--c-alarm);
}

.rel-track {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: var(--c-border);
  overflow: hidden;
}

.rel-axis {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--c-border-strong);
}

.rel-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: var(--c-accent);
  transition: width 0.45s var(--ease-out), left 0.45s var(--ease-out), right 0.45s var(--ease-out);
}

.rel-fill.is-neg {
  background: var(--c-alarm);
}
</style>
