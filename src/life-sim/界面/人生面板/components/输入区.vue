<template>
  <footer class="ls-input">
    <div class="ls-input-row">
      <textarea
        ref="输入框"
        class="ls-input-box"
        rows="1"
        placeholder="写下这一回合的行动"
        :value="草稿"
        @input="本地输入"
        @keydown.enter.exact="回车发送"
      ></textarea>
      <button class="ls-input-send" type="button" @click="发送">发送</button>
    </div>
  </footer>
</template>

<script setup lang="ts">
/**
 * 分钟推进的自建输入区。
 *
 * 草稿与酒馆原版输入框共用一份：玩家在界面里打字即写进原版输入框，
 * 点「发送」触发酒馆的发送按钮，随消息附上的声明由 脚本/发送拦截.txt 拼上。
 */
import { onMounted, onUnmounted, ref } from 'vue';
import { 取输入框, 触发发送 } from '../发送';

const 草稿 = ref('');
const 输入框 = ref<HTMLTextAreaElement | null>(null);

/* ── 与酒馆原版输入框共用同一份草稿 ── */

// 写回原版输入框时置位，避免它回传的 input 事件被当作玩家输入重复同步一次
let 写入中 = false;

function 写酒馆草稿(文本: string) {
  const 框 = 取输入框();
  if (!框) {
    return;
  }
  写入中 = true;
  框.value = 文本;
  框.dispatchEvent(new Event('input', { bubbles: true }));
  写入中 = false;
}

function 读酒馆草稿() {
  const 框 = 取输入框();
  if (框 && 框.value !== 草稿.value) {
    草稿.value = 框.value;
  }
}

function 外部输入() {
  if (写入中) {
    return;
  }
  读酒馆草稿();
}

function 自适应高度(框: HTMLTextAreaElement) {
  框.style.height = 'auto';
  框.style.height = `${Math.min(框.scrollHeight, 132)}px`;
}

function 本地输入(event: Event) {
  const 框 = event.target as HTMLTextAreaElement;
  草稿.value = 框.value;
  写酒馆草稿(草稿.value);
  自适应高度(框);
}

/* ── 发送 ── */

let 发送后计时: ReturnType<typeof setTimeout> | null = null;

function 发送() {
  触发发送();
  if (发送后计时) {
    clearTimeout(发送后计时);
  }
  // 酒馆发送之后会清空原版输入框，稍后再读一次，面板里的草稿才会随之清空
  发送后计时 = setTimeout(() => {
    发送后计时 = null;
    读酒馆草稿();
    if (输入框.value) {
      自适应高度(输入框.value);
    }
  }, 800);
}

// 回车发送、换行留给 Shift + 回车；输入法选字时的回车不算发送
function 回车发送(event: KeyboardEvent) {
  if (event.isComposing) {
    return;
  }
  event.preventDefault();
  发送();
}

function 窗口回焦() {
  读酒馆草稿();
}

onMounted(() => {
  读酒馆草稿();
  取输入框()?.addEventListener('input', 外部输入);
  if (输入框.value) {
    自适应高度(输入框.value);
  }
  window.addEventListener('focus', 窗口回焦);
});

onUnmounted(() => {
  取输入框()?.removeEventListener('input', 外部输入);
  window.removeEventListener('focus', 窗口回焦);
  if (发送后计时) {
    clearTimeout(发送后计时);
    发送后计时 = null;
  }
});
</script>

<style lang="scss" scoped>
.ls-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 14px;
  border-top: 1px solid var(--ls-border);
  background: var(--ls-surface);
}

.ls-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.ls-input-box {
  flex: 1 1 auto;
  min-width: 0;
  max-height: 132px;
  padding: 9px 12px;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text);
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  overflow-y: auto;
}

.ls-input-box::placeholder {
  color: var(--ls-text-faint);
}

.ls-input-box:focus {
  outline: none;
  border-color: var(--ls-accent-line);
}

.ls-input-send {
  flex: none;
  padding: 9px 18px;
  border: 1px solid var(--ls-accent);
  border-radius: var(--ls-r-sm);
  background: var(--ls-accent);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-input-send:hover {
    background: var(--ls-accent-hover);
    border-color: var(--ls-accent-hover);
  }
}

/* 窄屏：输入区常驻底部 */
@media (max-width: 1023px) {
  .ls-input {
    position: sticky;
    bottom: 0;
    z-index: 2;
    box-shadow: var(--ls-shadow-lift);
  }
}
</style>
