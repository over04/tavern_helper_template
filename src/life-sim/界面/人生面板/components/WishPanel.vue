<template>
  <section class="ls-wishes">
    <div class="ls-wishes-head">
      <span class="ls-wishes-label">心向</span>
      <span class="ls-wishes-hint">点一条即追加进输入框</span>
    </div>

    <div v-if="wishes.length" class="ls-wishes-row">
      <button
        v-for="(wish, index) in wishes"
        :key="`${wish}-${index}`"
        class="ls-wish"
        type="button"
        @click="增心向(wish)"
      >
        {{ wish }}
      </button>
    </div>
    <span v-else class="ls-empty">暂无方向</span>

    <div class="ls-wish-add">
      <input
        v-model="新方向"
        class="ls-wish-input"
        type="text"
        placeholder="写一条新的方向"
        @keydown.enter="回车加入"
      />
      <button class="ls-wish-add-btn" type="button" :disabled="!新方向.trim()" @click="加入">加入</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 增心向 } from '../追加';

defineProps<{
  wishes: string[];
}>();

const 新方向 = ref('');

function 加入() {
  const 文本 = 新方向.value.trim();
  if (!文本) {
    return;
  }
  增心向(文本);
  新方向.value = '';
}

// 输入法选字时的回车不算加入
function 回车加入(event: KeyboardEvent) {
  if (event.isComposing) {
    return;
  }
  加入();
}
</script>

<style lang="scss" scoped>
.ls-wishes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 13px 16px 15px;
  border-top: 1px solid var(--ls-border);
}

.ls-wishes-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.ls-wishes-label {
  font-size: 12px;
  color: var(--ls-text-faint);
}

.ls-wishes-hint {
  font-size: 11px;
  color: var(--ls-text-faint);
}

.ls-wishes-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ls-wish {
  padding: 4px 12px;
  border: 1px solid var(--ls-border-strong);
  border-radius: 999px;
  background: var(--ls-surface);
  color: var(--ls-text-body);
  font-size: 12.5px;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-wish:hover:not(:disabled) {
    background: var(--ls-accent-soft);
    border-color: var(--ls-accent-line);
    color: var(--ls-accent-hover);
  }
}

.ls-wish:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ls-empty {
  font-size: 12.5px;
  color: var(--ls-text-faint);
}

.ls-wish-add {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ls-wish-input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text);
  font-size: 12.5px;
}

.ls-wish-input::placeholder {
  color: var(--ls-text-faint);
}

.ls-wish-input:focus {
  outline: none;
  border-color: var(--ls-accent-line);
}

.ls-wish-input:disabled {
  background: var(--ls-bg-alt);
  cursor: not-allowed;
}

.ls-wish-add-btn {
  flex: none;
  padding: 6px 14px;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text-body);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-wish-add-btn:hover:not(:disabled) {
    border-color: var(--ls-accent-line);
    background: var(--ls-accent-soft);
    color: var(--ls-accent-hover);
  }
}

.ls-wish-add-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
