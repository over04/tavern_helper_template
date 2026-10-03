<template>
  <footer class="ls-settle">
    <button class="ls-settle-btn" type="button" @click="结算">结算本回合</button>
  </footer>
</template>

<script setup lang="ts">
/**
 * 全屏月推进底部的结算条。
 *
 * 全屏时酒馆的输入框与发送键都被界面遮挡，玩家无法点到，所以由界面自己触发发送；
 * 聊天层里酒馆的发送键就在下面，不渲染这一条。
 */
import { 触发发送 } from '../发送';
import { 结算前确认 } from '../结算提醒';
import { useDataStore } from '../store';

const store = useDataStore();

async function 结算() {
  if (await 结算前确认(store.data.事件)) {
    触发发送();
  }
}
</script>

<style lang="scss" scoped>
.ls-settle {
  flex: none;
  display: flex;
  padding: 12px 14px 14px;
  border-top: 1px solid var(--ls-border);
  background: var(--ls-surface);
}

.ls-settle-btn {
  flex: 1;
  padding: 11px 0;
  border: 1px solid var(--ls-accent);
  border-radius: var(--ls-r-sm);
  background: var(--ls-accent);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-settle-btn:hover {
    background: var(--ls-accent-hover);
    border-color: var(--ls-accent-hover);
  }
}
</style>
