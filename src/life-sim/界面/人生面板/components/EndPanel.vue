<template>
  <article class="finale">
    <header class="finale-head">
      <ClaudeMark :size="22" />
      <span class="finale-kicker">一生结算</span>
      <h2 class="finale-age">
        {{ finale.享年 }}<span class="finale-age-unit">岁</span>
      </h2>
      <p class="finale-cause">{{ finale.死因 }}</p>
    </header>

    <section class="finale-block">
      <span class="finale-label">一生</span>
      <p class="finale-text">{{ finale.一生总结 }}</p>
    </section>

    <section class="finale-block">
      <span class="finale-label">巅峰</span>
      <p class="finale-text">{{ finale.巅峰 }}</p>
    </section>

    <footer class="finale-foot">
      <p class="finale-epitaph">{{ finale.墓志铭 }}</p>
      <span class="finale-rate">{{ finale.评语 }}</span>
    </footer>
  </article>
</template>

<script setup lang="ts">
import ClaudeMark from './ClaudeMark.vue';

defineProps<{
  finale: { 享年: number; 死因: string; 一生总结: string; 巅峰: string; 墓志铭: string; 评语: string };
}>();
</script>

<style lang="scss" scoped>
.finale {
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  overflow: hidden;
  animation: cl-enter 0.5s var(--ease-out) both;
}

.finale-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 30px 20px 26px;
  background: var(--c-bg-alt);
  border-bottom: 1px solid var(--c-border);
}

.finale-kicker {
  font-size: 12px;
  letter-spacing: 0.16em;
  color: var(--c-text-muted);
}

.finale-age {
  font-size: 38px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}

.finale-age-unit {
  margin-left: 5px;
  font-size: 15px;
  font-weight: 400;
  color: var(--c-text-muted);
}

.finale-cause {
  font-size: 13px;
  color: var(--c-text-muted);
}

.finale-block {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--c-border);
}

.finale-label {
  font-size: 12px;
  color: var(--c-text-faint);
}

.finale-text {
  font-family: var(--f-serif);
  font-size: 14px;
  line-height: 1.85;
  color: var(--c-text-body);
  white-space: pre-wrap;
}

.finale-foot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 20px 26px;
}

.finale-epitaph {
  font-family: var(--f-serif);
  font-size: 16px;
  line-height: 1.7;
  text-align: center;
  color: var(--c-text);
}

.finale-rate {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--c-text-faint);
}
</style>
