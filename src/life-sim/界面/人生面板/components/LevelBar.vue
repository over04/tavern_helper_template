<template>
  <div class="ls-level">
    <div class="ls-level-head">
      <span class="ls-level-name">{{ name }}</span>
      <span class="ls-level-meta">
        <b>L{{ 层级 }}</b>
        <span class="ls-level-pct">{{ 进度 }}%</span>
        <span class="ls-level-cap">上限 {{ 上限 }}</span>
      </span>
    </div>
    <div class="ls-level-track">
      <span
        v-for="step in STEPS"
        :key="step"
        class="ls-level-cell"
        :class="{ 'ls-is-done': step < 层级, 'ls-is-capped': step > 上限 }"
      >
        <i v-if="step === 层级" class="ls-level-fill" :style="{ width: `${进度}%` }" />
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
.ls-level {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ls-level-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.ls-level-name {
  font-size: 13px;
  color: var(--ls-text);
}

.ls-level-meta {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.ls-level-meta b {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ls-accent-hover);
}

.ls-level-pct {
  font-size: 11.5px;
  color: var(--ls-text-muted);
}

.ls-level-cap {
  font-size: 11px;
  color: var(--ls-text-faint);
}

.ls-level-track {
  display: flex;
  gap: 3px;
  height: 6px;
}

.ls-level-cell {
  position: relative;
  flex: 1;
  border-radius: 2px;
  background: var(--ls-border);
  overflow: hidden;
}

.ls-level-cell.ls-is-done {
  background: var(--ls-accent);
}

.ls-level-cell.ls-is-capped {
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--ls-border);
}

.ls-level-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 2px;
  background: var(--ls-accent);
  transition: width 0.45s var(--ls-ease-out);
}
</style>
