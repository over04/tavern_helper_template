<template>
  <div class="focus">
    <div class="focus-dial">
      <svg class="focus-svg" :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" aria-label="精力份额占比">
        <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" class="focus-track" />
        <circle
          v-for="segment in segments"
          :key="segment.field"
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          class="focus-arc"
          :stroke="segment.color"
          :stroke-dasharray="`${segment.length} ${CIRCUMFERENCE - segment.length}`"
          :stroke-dashoffset="segment.offset"
        />
      </svg>
      <span class="focus-center" :class="{ 'is-over': isOverdrawn }">{{ totalLabel }}</span>
    </div>
    <div class="focus-legend">
      <span v-for="segment in segments" :key="segment.field" class="focus-item">
        <i class="focus-dot" :style="{ background: segment.color }" />
        <span class="focus-field">{{ segment.field }}</span>
        <b>{{ segment.share }}</b>
      </span>
      <span v-if="!segments.length" class="empty">未分配</span>
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
  'var(--c-accent)',
  'var(--c-positive)',
  'var(--c-caution)',
  'var(--c-accent-hover)',
  'var(--c-text-muted)',
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
.focus {
  display: flex;
  align-items: center;
  gap: 18px;
}

.focus-dial {
  position: relative;
  flex: none;
  width: 108px;
  height: 108px;
}

.focus-svg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.focus-track {
  fill: none;
  stroke: var(--c-border);
  stroke-width: 10;
}

.focus-arc {
  fill: none;
  stroke-width: 10;
  transition: stroke-dasharray 0.5s var(--ease-out), stroke-dashoffset 0.5s var(--ease-out);
}

.focus-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 600;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.focus-center.is-over {
  color: var(--c-alarm);
}

.focus-legend {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.focus-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--c-text-body);
}

.focus-dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.focus-field {
  color: var(--c-text);
}

.focus-item b {
  margin-left: auto;
  font-weight: 600;
  color: var(--c-text-muted);
  font-variant-numeric: tabular-nums;
}

.empty {
  font-size: 12.5px;
  color: var(--c-text-faint);
}
</style>
