<template>
  <div class="ls-rel">
    <div class="ls-rel-head">
      <span class="ls-rel-name">{{ name }}</span>
      <span class="ls-rel-tag">{{ identity }} · {{ stage }}</span>
      <span class="ls-rel-value" :class="{ 'ls-is-neg': value < 0 }">{{ value }}</span>
    </div>
    <div class="ls-rel-track">
      <span class="ls-rel-axis" />
      <span class="ls-rel-fill" :class="{ 'ls-is-neg': value < 0 }" :style="fillStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  identity: string;
  stage: string;
  value: number;
}>();

const fillStyle = computed(() => {
  const clamped = Math.max(-100, Math.min(100, props.value));
  const width = `${Math.abs(clamped) / 2}%`;
  return clamped >= 0 ? { left: '50%', width } : { right: '50%', width };
});
</script>

<style lang="scss" scoped>
.ls-rel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ls-rel-head {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.ls-rel-name {
  font-size: 13px;
  color: var(--ls-text);
}

.ls-rel-tag {
  font-size: 11.5px;
  color: var(--ls-text-faint);
}

.ls-rel-value {
  margin-left: auto;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ls-accent-hover);
  font-variant-numeric: tabular-nums;
}

.ls-rel-value.ls-is-neg {
  color: var(--ls-alarm);
}

.ls-rel-track {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: var(--ls-border);
  overflow: hidden;
}

.ls-rel-axis {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--ls-border-strong);
}

.ls-rel-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: var(--ls-accent);
  transition: width 0.45s var(--ls-ease-out), left 0.45s var(--ls-ease-out), right 0.45s var(--ls-ease-out);
}

.ls-rel-fill.ls-is-neg {
  background: var(--ls-alarm);
}
</style>
