<template>
  <div class="ls-focus">
    <div class="ls-focus-dial">
      <svg class="ls-focus-svg" :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" aria-label="精力份额占比">
        <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" class="ls-focus-track" />
        <circle
          v-for="segment in segments"
          :key="segment.field"
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          class="ls-focus-arc"
          :stroke="segment.color"
          :stroke-dasharray="`${segment.length} ${CIRCUMFERENCE - segment.length}`"
          :stroke-dashoffset="segment.offset"
        />
      </svg>
      <span class="ls-focus-center" :class="{ 'ls-is-over': isOverdrawn }">{{ totalLabel }}</span>
    </div>
    <div class="ls-focus-legend">
      <span v-for="segment in segments" :key="segment.field" class="ls-focus-item">
        <i class="ls-focus-dot" :style="{ background: segment.color }" />
        <span class="ls-focus-field">{{ segment.field }}</span>
        <b>{{ segment.share }}</b>
      </span>
      <span v-if="!segments.length" class="ls-empty">未分配</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  focus: Record<string, number>;
}>();

const SIZE = 108;
const CENTER = SIZE / 2;
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PALETTE = [
  'var(--ls-accent)',
  'var(--ls-positive)',
  'var(--ls-caution)',
  'var(--ls-accent-hover)',
  'var(--ls-text-muted)',
];

const total = computed(() => Object.values(props.focus ?? {}).reduce((sum, share) => sum + share, 0));

const segments = computed(() => {
  const entries = Object.entries(props.focus ?? {});
  const base = Math.max(1, total.value);
  let accumulated = 0;
  return entries.map(([field, share], index) => {
    const length = (share / base) * CIRCUMFERENCE;
    const segment = {
      field,
      share,
      color: PALETTE[index % PALETTE.length]!,
      length,
      offset: -accumulated,
    };
    accumulated += length;
    return segment;
  });
});

const totalLabel = computed(() => {
  const value = total.value;
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '');
});

const isOverdrawn = computed(() => total.value > 1.0001);
</script>

<style lang="scss" scoped>
.ls-focus {
  display: flex;
  align-items: center;
  gap: 18px;
}

.ls-focus-dial {
  position: relative;
  flex: none;
  width: 108px;
  height: 108px;
}

.ls-focus-svg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ls-focus-track {
  fill: none;
  stroke: var(--ls-border);
  stroke-width: 10;
}

.ls-focus-arc {
  fill: none;
  stroke-width: 10;
  transition: stroke-dasharray 0.5s var(--ls-ease-out), stroke-dashoffset 0.5s var(--ls-ease-out);
}

.ls-focus-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 600;
  color: var(--ls-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.ls-focus-center.ls-is-over {
  color: var(--ls-alarm);
}

.ls-focus-legend {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.ls-focus-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--ls-text-body);
}

.ls-focus-dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.ls-focus-field {
  color: var(--ls-text);
}

.ls-focus-item b {
  margin-left: auto;
  font-weight: 600;
  color: var(--ls-text-muted);
  font-variant-numeric: tabular-nums;
}

.ls-empty {
  font-size: 12.5px;
  color: var(--ls-text-faint);
}
</style>
