<template>
  <div class="ring">
    <div class="ring-dial">
      <svg class="ring-svg" :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" :aria-label="`${label} ${value}`">
        <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" class="ring-track" />
        <circle
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          class="ring-fill"
          :stroke="strokeColor"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <span class="ring-value">{{ value }}</span>
    </div>
    <span class="ring-label">{{ label }}</span>
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
.ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}

.ring-dial {
  position: relative;
  width: 68px;
  height: 68px;
}

.ring-svg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: var(--c-border);
  stroke-width: 5;
}

.ring-fill {
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.55s var(--ease-out), stroke 0.2s var(--ease);
}

.ring-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.ring-label {
  font-size: 12.5px;
  color: var(--c-text-muted);
}
</style>
