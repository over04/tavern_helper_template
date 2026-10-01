<template>
  <div class="meter">
    <div class="meter-head">
      <span class="meter-label">{{ label }}</span>
      <span class="meter-value">
        {{ value }}<span v-if="max !== null" class="meter-max">/{{ max }}</span>
      </span>
    </div>
    <div class="meter-track">
      <div class="meter-fill" :style="{ width: `${ratio * 100}%`, background: fillColor }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    value: number;
    max?: number | null;
    tone?: 'accent' | 'positive' | 'caution' | 'alarm' | 'neutral';
  }>(),
  { max: 100, tone: 'accent' },
);

const ratio = computed(() => {
  const ceiling = props.max ?? 100;
  if (!ceiling) {
    return 0;
  }
  return Math.max(0, Math.min(1, props.value / ceiling));
});

const fillColor = computed(() => {
  switch (props.tone) {
    case 'positive':
      return 'var(--c-positive)';
    case 'caution':
      return 'var(--c-caution)';
    case 'alarm':
      return 'var(--c-alarm)';
    case 'neutral':
      return 'var(--c-text-faint)';
    default:
      return 'var(--c-accent)';
  }
});
</script>

<style lang="scss" scoped>
.meter {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meter-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.meter-label {
  font-size: 13px;
  color: var(--c-text-body);
}

.meter-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}

.meter-max {
  margin-left: 1px;
  font-size: 11px;
  font-weight: 400;
  color: var(--c-text-faint);
}

.meter-track {
  height: 4px;
  border-radius: 999px;
  background: var(--c-border);
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s var(--ease-out), background-color 0.2s var(--ease);
}
</style>
