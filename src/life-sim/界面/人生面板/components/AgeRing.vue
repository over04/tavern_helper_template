<template>
  <div class="ls-age" :title="`${phaseName} ${phaseFrom}~${phaseTo} 岁`">
    <div class="ls-age-dial">
      <svg class="ls-age-svg" :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" :aria-label="`${phaseName} 阶段进度`">
        <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" class="ls-age-track" />
        <circle
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          class="ls-age-fill"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <span class="ls-age-center">{{ phaseName }}</span>
    </div>
    <span class="ls-age-range">{{ phaseFrom }}~{{ phaseTo }} 岁</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  ageYear: number;
  ageMonth: number;
}>();

const PHASES: { name: string; from: number; to: number }[] = [
  { name: '新生儿', from: 0, to: 2 },
  { name: '幼年', from: 3, to: 6 },
  { name: '童年', from: 7, to: 12 },
  { name: '少年', from: 13, to: 17 },
  { name: '青年', from: 18, to: 29 },
  { name: '成年', from: 30, to: 44 },
  { name: '中年', from: 45, to: 54 },
  { name: '壮年', from: 55, to: 64 },
  { name: '老年', from: 65, to: 79 },
  { name: '暮年', from: 80, to: 100 },
];

const SIZE = 62;
const CENTER = SIZE / 2;
const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const current = computed(
  () => PHASES.find(item => props.ageYear >= item.from && props.ageYear <= item.to) ?? PHASES[PHASES.length - 1]!,
);

const phaseName = computed(() => current.value.name);
const phaseFrom = computed(() => current.value.from);
const phaseTo = computed(() => current.value.to);

const dashOffset = computed(() => {
  const exact = props.ageYear + props.ageMonth / 12;
  const span = current.value.to - current.value.from + 1;
  const ratio = Math.max(0, Math.min(1, (exact - current.value.from) / span));
  return CIRCUMFERENCE * (1 - ratio);
});
</script>

<style lang="scss" scoped>
.ls-age {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ls-age-dial {
  position: relative;
  width: 62px;
  height: 62px;
}

.ls-age-svg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ls-age-track {
  fill: none;
  stroke: var(--ls-border);
  stroke-width: 4;
}

.ls-age-fill {
  fill: none;
  stroke: var(--ls-accent);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.55s var(--ls-ease-out);
}

.ls-age-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-accent-hover);
  letter-spacing: -0.01em;
}

.ls-age-range {
  font-size: 10.5px;
  color: var(--ls-text-faint);
  font-variant-numeric: tabular-nums;
}
</style>
