<template>
  <div v-if="声明文本" class="ls-command">
    <span class="ls-command-label">待发送命令</span>
    <pre class="ls-command-text">{{ 声明文本 }}</pre>
  </div>
</template>

<script setup lang="ts">
/**
 * 待发送命令：把界面里已记下、尚未随消息发出的内容拼成声明原文显示出来。
 *
 * 只在聊天层渲染。那里没有自建发送按钮，玩家需看清原文后再按酒馆的发送键；
 * 全屏时发送由界面自己的按钮完成，不再显示原文。
 */

import { computed, onMounted, onUnmounted } from 'vue';
import { 拼声明, 待发送更新事件, use待发送 } from '../待发送';

const 待发送 = use待发送();

const 声明文本 = computed(() => 拼声明(待发送.状态.value));

function 同步() {
  待发送.刷新();
}

onMounted(() => {
  同步();
  window.addEventListener(待发送更新事件, 同步);
});

onUnmounted(() => {
  window.removeEventListener(待发送更新事件, 同步);
});
</script>

<style lang="scss" scoped>
.ls-command {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px 12px;
  border: 1px solid var(--ls-accent-line);
  border-radius: var(--ls-r-sm);
  background: var(--ls-accent-soft);
}

.ls-command-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ls-accent-hover);
}

.ls-command-text {
  padding: 8px 10px;
  border-radius: var(--ls-r-xs);
  background: var(--ls-surface);
  color: var(--ls-text-body);
  font-family: var(--ls-f-mono);
  font-size: 11.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
