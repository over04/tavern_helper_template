<template>
  <article class="ls-finale">
    <header class="ls-finale-head">
      <ClaudeMark :size="22" />
      <span class="ls-finale-kicker">一生结算</span>
      <h2 class="ls-finale-age">
        {{ finale.享年 }}<span class="ls-finale-age-unit">岁</span>
      </h2>
      <p class="ls-finale-cause">{{ finale.死因 }}</p>
    </header>

    <section class="ls-finale-block">
      <span class="ls-finale-label">一生</span>
      <p class="ls-finale-text">{{ finale.一生总结 }}</p>
    </section>

    <section class="ls-finale-block">
      <span class="ls-finale-label">巅峰</span>
      <p class="ls-finale-text">{{ finale.巅峰 }}</p>
    </section>

    <footer class="ls-finale-foot">
      <p class="ls-finale-epitaph">{{ finale.墓志铭 }}</p>
      <span class="ls-finale-rate">{{ finale.评语 }}</span>
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
.ls-finale {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--ls-panel-width);
  margin: 0 auto;
  background: var(--ls-surface);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  overflow: hidden;
  animation: ls-enter 0.5s var(--ls-ease-out) both;
}

.ls-finale-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 30px 20px 26px;
  background: var(--ls-bg-alt);
  border-bottom: 1px solid var(--ls-border);
}

.ls-finale-kicker {
  font-size: 12px;
  letter-spacing: 0.16em;
  color: var(--ls-text-muted);
}

.ls-finale-age {
  font-size: 38px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--ls-text);
  font-variant-numeric: tabular-nums;
}

.ls-finale-age-unit {
  margin-left: 5px;
  font-size: 15px;
  font-weight: 400;
  color: var(--ls-text-muted);
}

.ls-finale-cause {
  font-size: 13px;
  color: var(--ls-text-muted);
}

.ls-finale-block {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--ls-border);
}

.ls-finale-label {
  font-size: 12px;
  color: var(--ls-text-faint);
}

.ls-finale-text {
  font-family: var(--ls-f-serif);
  font-size: 14px;
  line-height: 1.85;
  color: var(--ls-text-body);
  white-space: pre-wrap;
}

.ls-finale-foot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 20px 26px;
}

.ls-finale-epitaph {
  font-family: var(--ls-f-serif);
  font-size: 16px;
  line-height: 1.7;
  text-align: center;
  color: var(--ls-text);
}

.ls-finale-rate {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--ls-text-faint);
}
</style>
