<template>
  <div class="level">
    <div class="level-head">
      <span class="level-name">{{ name }}</span>
      <span class="level-meta">
        <b>L{{ 层级 }}</b>
        <span class="level-pct">{{ 进度 }}%</span>
        <span class="level-cap">上限 {{ 上限 }}</span>
      </span>
    </div>
    <div class="level-track">
      <span
        v-for="step in STEPS"
        :key="step"
        class="level-cell"
        :class="{ 'is-done': step < 层级, 'is-capped': step > 上限 }"
      >
        <i v-if="step === 层级" class="level-fill" :style="{ width: `${进度}%` }" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  层级: number;
  进度: number;
  上限: number;
}>();

const STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<style lang="scss" scoped>
.level {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.level-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.level-name {
  font-size: 13px;
  color: var(--c-text);
}

.level-meta {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.level-meta b {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--c-accent-hover);
}

.level-pct {
  font-size: 11.5px;
  color: var(--c-text-muted);
}

.level-cap {
  font-size: 11px;
  color: var(--c-text-faint);
}

.level-track {
  display: flex;
  gap: 3px;
  height: 6px;
}

.level-cell {
  position: relative;
  flex: 1;
  border-radius: 2px;
  background: var(--c-border);
  overflow: hidden;
}

.level-cell.is-done {
  background: var(--c-accent);
}

.level-cell.is-capped {
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--c-border);
}

.level-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 2px;
  background: var(--c-accent);
  transition: width 0.45s var(--ease-out);
}
</style>
