<template>
  <svg class="ls-mark" :style="{ width: `${size}px`, height: `${size}px` }" viewBox="0 0 24 24" aria-hidden="true">
    <g stroke="currentColor" stroke-linecap="round">
      <line
        v-for="ray in RAYS"
        :key="ray.angle"
        x1="12"
        y1="12"
        x2="12"
        :y2="ray.inner"
        :stroke-width="ray.width"
        :transform="`rotate(${ray.angle} 12 12)`"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 20 });

// 星芒：12 道射线，主轴粗、次轴细，模拟 Claude 的放射标记
const RAYS = Array.from({ length: 12 }, (_, index) => {
  const primary = index % 3 === 0;
  return {
    angle: index * 30,
    inner: primary ? 1.4 : index % 3 === 1 ? 3.4 : 2.6,
    width: primary ? 2.1 : 1.2,
  };
});
</script>

<style scoped>
.ls-mark {
  display: block;
  color: var(--ls-accent);
  flex: none;
}
</style>
