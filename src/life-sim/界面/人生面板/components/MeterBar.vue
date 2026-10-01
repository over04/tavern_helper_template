<template>
  <div class="ls-meter">
    <div class="ls-meter-head">
      <span class="ls-meter-label">{{ label }}</span>
      <span class="ls-meter-value">
        {{ value }}<span v-if="max !== null" class="ls-meter-max">/{{ max }}</span>
      </span>
    </div>
    <div class="ls-meter-track">
      <div class="ls-meter-fill" :style="{ width: `${ratio * 100}%`, background: fillColor }" />
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
      return 'var(--ls-positive)';
    case 'caution':
      return 'var(--ls-caution)';
    case 'alarm':
      return 'var(--ls-alarm)';
    case 'neutral':
      return 'var(--ls-text-faint)';
    default:
      return 'var(--ls-accent)';
  }
});
</script>

<style lang="scss" scoped>
.ls-meter {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ls-meter-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.ls-meter-label {
  font-size: 13px;
  color: var(--ls-text-body);
}

.ls-meter-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--ls-text);
  font-variant-numeric: tabular-nums;
}

.ls-meter-max {
  margin-left: 1px;
  font-size: 11px;
  font-weight: 400;
  color: var(--ls-text-faint);
}

.ls-meter-track {
  height: 4px;
  border-radius: 999px;
  background: var(--ls-border);
  overflow: hidden;
}

.ls-meter-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s var(--ls-ease-out), background-color 0.2s var(--ls-ease);
}
</style>
