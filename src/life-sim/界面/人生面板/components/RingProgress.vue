<template>
  <div class="ls-ring">
    <div class="ls-ring-dial">
      <svg class="ls-ring-svg" :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" :aria-label="`${label} ${value}`">
        <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" class="ls-ring-track" />
        <circle
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          class="ls-ring-fill"
          :stroke="strokeColor"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <span class="ls-ring-value">{{ value }}</span>
    </div>
    <span class="ls-ring-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    value: number;
    max?: number;
    tone?: 'accent' | 'positive' | 'caution' | 'alarm' | 'neutral';
  }>(),
  { max: 100, tone: 'accent' },
);

const SIZE = 68;
const CENTER = SIZE / 2;
const RADIUS = 27;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ratio = computed(() => {
  if (!props.max) {
    return 0;
  }
  return Math.max(0, Math.min(1, props.value / props.max));
});

const dashOffset = computed(() => CIRCUMFERENCE * (1 - ratio.value));

const strokeColor = computed(() => {
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
.ls-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}

.ls-ring-dial {
  position: relative;
  width: 68px;
  height: 68px;
}

.ls-ring-svg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ls-ring-track {
  fill: none;
  stroke: var(--ls-border);
  stroke-width: 5;
}

.ls-ring-fill {
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.55s var(--ls-ease-out), stroke 0.2s var(--ls-ease);
}

.ls-ring-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--ls-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.ls-ring-label {
  font-size: 12.5px;
  color: var(--ls-text-muted);
}
</style>
