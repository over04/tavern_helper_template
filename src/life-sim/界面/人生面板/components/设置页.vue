<script lang="ts">
/** 设置页左侧的分组 */
type 分组键 = '提醒' | '动效';
</script>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { 读设置, 写设置 } from '../设置';

const 设置值 = reactive(读设置());

const 分组列表: { 键: 分组键; 名称: string; 摘要: string }[] = [
  { 键: '提醒', 名称: '结算前提醒', 摘要: '事件尚未选择选项时，点「以此生开始」先弹一次确认' },
  { 键: '动效', 名称: '动效', 摘要: '入场淡入与页签浮现' },
];

const 当前键 = ref<分组键>('提醒');

const 当前 = computed(() => 分组列表.find(组 => 组.键 === 当前键.value) ?? 分组列表[0]);

/** 每次改动都整份写回全局变量；设置状态是模块级单例，其余组件立刻跟着变 */
function 保存() {
  写设置({ ...设置值 });
}

function 改开关(键: '结算前提醒' | '动效', 值: boolean) {
  设置值[键] = 值;
  保存();
}
</script>

<template>
  <div class="ls-set">
    <nav class="ls-set-nav" aria-label="设置分组">
      <button
        v-for="组 in 分组列表"
        :key="组.键"
        class="ls-set-tab"
        :class="{ 'ls-is-active': 当前键 === 组.键 }"
        type="button"
        @click="当前键 = 组.键"
      >
        {{ 组.名称 }}
      </button>
    </nav>

    <section class="ls-set-main">
      <header class="ls-set-head">
        <h2 class="ls-set-title">{{ 当前.名称 }}</h2>
        <p class="ls-set-note">{{ 当前.摘要 }}</p>
      </header>

      <div :key="当前.键" class="ls-set-body">
        <div v-if="当前键 === '提醒'" class="ls-set-row">
          <span class="ls-set-label">
            事件未选择选项时先弹一次确认
            <span class="ls-set-hint">事件表里还有事件尚未选择选项时，点「以此生开始」先弹一次确认</span>
          </span>
          <div class="ls-set-input">
            <button
              class="ls-switch"
              :class="{ 'ls-switch-on': 设置值.结算前提醒 }"
              type="button"
              role="switch"
              :aria-checked="设置值.结算前提醒"
              @click="改开关('结算前提醒', !设置值.结算前提醒)"
            >
              <span class="ls-knob"></span>
            </button>
            <span class="ls-set-value">{{ 设置值.结算前提醒 ? '开启' : '关闭' }}</span>
          </div>
        </div>

        <div v-else class="ls-set-row">
          <span class="ls-set-label">界面动效</span>
          <div class="ls-set-input">
            <button
              class="ls-switch"
              :class="{ 'ls-switch-on': 设置值.动效 }"
              type="button"
              role="switch"
              :aria-checked="设置值.动效"
              @click="改开关('动效', !设置值.动效)"
            >
              <span class="ls-knob"></span>
            </button>
            <span class="ls-set-value">{{ 设置值.动效 ? '开启' : '关闭' }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.ls-set {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  width: 100%;
  box-sizing: border-box;
}

.ls-set-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  background: var(--ls-surface);
}

.ls-set-tab {
  padding: 7px 9px;
  border: none;
  border-radius: var(--ls-r-sm);
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 12.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-set-tab:hover {
    background: var(--ls-surface-hover);
    color: var(--ls-text);
  }
}

.ls-set-tab.ls-is-active {
  background: var(--ls-accent-soft);
  color: var(--ls-accent-hover);
}

.ls-set-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  background: var(--ls-surface);
  overflow: hidden;
}

.ls-set-head {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 13px 16px 11px;
  border-bottom: 1px solid var(--ls-border);
}

.ls-set-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-text);
}

.ls-set-note {
  font-size: 11.5px;
  color: var(--ls-text-faint);
  line-height: 1.5;
}

.ls-set-body {
  display: flex;
  flex-direction: column;
  padding: 6px 16px 16px;
  animation: ls-reveal 0.3s var(--ls-ease-out) both;
}

.ls-set-row {
  display: grid;
  grid-template-columns: minmax(120px, 220px) minmax(0, 1fr);
  align-items: start;
  gap: 6px 16px;
  padding: 11px 0;
}

.ls-set-row + .ls-set-row {
  border-top: 1px solid var(--ls-border);
}

.ls-set-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 4px;
  font-size: 12.5px;
  color: var(--ls-text-body);
}

.ls-set-hint {
  color: var(--ls-text-faint);
  font-size: 11.5px;
  line-height: 1.5;
}

.ls-set-input {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.ls-set-num {
  width: 92px;
  padding: 5px 9px;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.ls-set-num:focus {
  border-color: var(--ls-accent);
  box-shadow: 0 0 0 3px var(--ls-accent-soft);
  outline: none;
}

.ls-set-unit {
  color: var(--ls-text-faint);
  font-size: 12px;
}

.ls-set-value {
  color: var(--ls-text-muted);
  font-size: 12.5px;
}

/* 开关：位置只在开与关之间切换，hover 只改颜色 */
.ls-switch {
  position: relative;
  flex: none;
  width: 38px;
  height: 22px;
  border: none;
  border-radius: 999px;
  background: var(--ls-border-strong);
  cursor: pointer;
}

@media (hover: hover) {
  .ls-switch:hover {
    background: var(--ls-text-faint);
  }
}

.ls-switch-on {
  background: var(--ls-accent);
}

@media (hover: hover) {
  .ls-switch-on:hover {
    background: var(--ls-accent-hover);
  }
}

.ls-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: var(--ls-shadow-hair);
}

.ls-switch-on .ls-knob {
  left: 18px;
}

@media (max-width: 1023px) {
  .ls-set {
    grid-template-columns: minmax(0, 1fr);
  }

  .ls-set-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 5px;
  }

  .ls-set-tab {
    flex: none;
  }

  .ls-set-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .ls-set-label {
    padding-top: 0;
  }
}
</style>
