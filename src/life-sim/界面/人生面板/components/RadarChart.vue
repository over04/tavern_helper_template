<template>
  <div class="radar">
    <svg class="radar-svg" :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" aria-label="六维天赋雷达图">
      <polygon
        v-for="level in GRID_LEVELS"
        :key="`grid-${level}`"
        :points="gridPoints(level)"
        class="radar-grid"
      />
      <line
        v-for="axis in axes"
        :key="`axis-${axis.label}`"
        :x1="CENTER"
        :y1="CENTER"
        :x2="axis.tipX"
        :y2="axis.tipY"
        class="radar-axis"
      />
      <polygon :points="areaPoints" class="radar-area" />
      <circle
        v-for="axis in axes"
        :key="`dot-${axis.label}`"
        :cx="axis.pointX"
        :cy="axis.pointY"
        r="3"
        class="radar-dot"
      />
      <text
        v-for="axis in axes"
        :key="`label-${axis.label}`"
        :x="axis.labelX"
        :y="axis.labelY"
        :text-anchor="axis.anchor"
        class="radar-label"
      >
        {{ axis.label }}
      </text>
      <text
        v-for="axis in axes"
        :key="`value-${axis.label}`"
        :x="axis.labelX"
        :y="axis.labelY + 15"
        :text-anchor="axis.anchor"
        class="radar-value"
      >
        {{ axis.value }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  values: { label: string; value: number }[];
}>();

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 74;
const LABEL_GAP = 24;
const GRID_LEVELS = [0.25, 0.5, 0.75, 1];

function pointAt(index: number, count: number, ratio: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: CENTER + cos * RADIUS * ratio,
    y: CENTER + sin * RADIUS * ratio,
    cos,
    sin,
  };
}

const axes = computed(() => {
  const count = props.values.length || 1;
  return props.values.map((item, index) => {
    const ratio = Math.max(0, Math.min(1, item.value / 100));
    const tip = pointAt(index, count, 1);
    const point = pointAt(index, count, ratio);
    return {
      label: item.label,
      value: item.value,
      tipX: tip.x,
      tipY: tip.y,
      pointX: point.x,
      pointY: point.y,
      labelX: CENTER + tip.cos * (RADIUS + LABEL_GAP),
      labelY: CENTER + tip.sin * (RADIUS + LABEL_GAP),
      anchor: Math.abs(tip.cos) < 0.2 ? 'middle' : tip.cos > 0 ? 'start' : 'end',
    };
  });
});

const areaPoints = computed(() => axes.value.map(axis => `${axis.pointX},${axis.pointY}`).join(' '));

function gridPoints(level: number) {
  const count = props.values.length || 1;
  return Array.from({ length: count }, (_, index) => {
    const point = pointAt(index, count, level);
    return `${point.x},${point.y}`;
  }).join(' ');
}
</script>

<style lang="scss" scoped>
.radar {
  display: flex;
  justify-content: center;
  padding: 14px 16px 16px;
}

.radar-svg {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
}

.radar-grid {
  fill: none;
  stroke: var(--c-border);
  stroke-width: 1;
}

.radar-axis {
  stroke: var(--c-border);
  stroke-width: 1;
}

.radar-area {
  fill: var(--c-accent-soft);
  stroke: var(--c-accent);
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.radar-dot {
  fill: var(--c-accent);
}

.radar-label {
  font-size: 11.5px;
  fill: var(--c-text-body);
}

.radar-value {
  font-size: 11px;
  font-weight: 600;
  fill: var(--c-accent-hover);
  font-variant-numeric: tabular-nums;
}
</style>
