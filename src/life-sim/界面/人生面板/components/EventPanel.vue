<template>
  <section v-if="entries.length" class="ls-events">
    <div class="ls-event-list">
      <article v-for="[name, ev] in entries" :key="name" class="ls-event">
        <header class="ls-event-head">
          <h4 class="ls-event-name">{{ name }}</h4>
          <span v-if="ev.发生时间" class="ls-event-time">{{ ev.发生时间 }}</span>
          <span v-if="ev.截止时间" class="ls-event-deadline">{{ ev.截止时间 }}</span>
          <span v-if="ev.所属主题" class="ls-event-theme">{{ ev.所属主题 }}</span>
        </header>
        <p class="ls-event-detail">{{ ev.细节段落 }}</p>

        <div class="ls-event-options">
          <button
            v-for="option in optionList(ev)"
            :key="option.key"
            class="ls-option"
            type="button"
            @click="pickOption(name, option)"
          >
            <span class="ls-option-index">{{ option.index }}</span>
            <span class="ls-option-act">{{ option.action }}</span>
            <span class="ls-option-difficulty" :data-level="option.level">{{ option.level }}</span>
            <span v-if="option.cost" class="ls-option-cost">{{ option.cost }}</span>
          </button>

          <!-- 固定第 5 条「其他」：四条之后固定追加，点开在下方展开手写输入区 -->
          <button
            class="ls-option ls-option-other"
            :class="{ 'is-open': 展开[name] }"
            type="button"
            @click="切换其他(name)"
          >
            <span class="ls-option-index" aria-hidden="true"></span>
            <span class="ls-option-act">其他</span>
            <span class="ls-option-difficulty">待定</span>
          </button>

          <div v-if="展开[name]" class="ls-other">
            <textarea
              class="ls-other-input"
              rows="2"
              placeholder="写下你想做的事，随消息一起交给模型判定"
              :value="手写[name] ?? ''"
              @input="写手写(name, $event)"
            ></textarea>
            <div class="ls-other-foot">
              <span class="ls-other-hint">写好后点「确定」作为本条事件的选项</span>
              <button
                class="ls-other-save"
                type="button"
                :disabled="!(手写[name] ?? '').trim()"
                @click="确定其他(name)"
              >
                确定
              </button>
            </div>
          </div>
        </div>

        <div class="ls-fate">
          <span class="ls-fate-label">命运点</span>
          <div class="ls-fate-actions">
            <button
              v-for="way in FATE_WAYS"
              :key="way.key"
              class="ls-fate-btn"
              :class="{ 'is-picked': 选中命运点(name) === way.key }"
              type="button"
              :disabled="!canUseFate(name, way.cost)"
              @click="pickFate(name, way.key)"
            >
              <span class="ls-fate-act">{{ way.label }}</span>
              <span class="ls-fate-cost">{{ way.cost }} 点</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { 选选项 } from '../待发送';

type Option = {
  动作: string;
  代价: string;
  难度: string;
  取项?: string;
  主项?: string;
  领域?: string;
};

type Event = {
  细节段落: string;
  发生时间: string;
  截止时间: string;
  所属主题: string;
  选项: Record<string, Option>;
};

const props = defineProps<{
  events: Record<string, Event>;
  fate: number;
}>();

// 选项键固定为 一~四：界面显示的序号即判定脚本取用 stat.事件[名].选项[键] 的序号，两处顺序必须一致
const OPTION_KEYS = ['一', '二', '三', '四'];

const FATE_WAYS = [
  { key: '重掷', label: '重掷', cost: 1 },
  { key: '加值', label: '加值 +20', cost: 2 },
  { key: '改判', label: '改判为成功', cost: 3 },
];

// 手写输入区的展开状态与草稿都只属于本组件
const 展开 = reactive<Record<string, boolean>>({});
const 手写 = reactive<Record<string, string>>({});

const entries = computed(() => Object.entries(props.events ?? {}));

const 余量 = computed(() => Math.max(0, Math.round(Number(props.fate) || 0)));

function optionList(ev: Event) {
  const 选项 = ev.选项 ?? {};
  const list: { key: string; index: number; action: string; cost: string; level: string }[] = [];
  OPTION_KEYS.forEach((key, i) => {
    const op = 选项[key];
    if (!op) {
      return;
    }
    list.push({
      key,
      index: i + 1,
      action: op.动作 ?? '',
      cost: op.代价 ?? '',
      level: op.难度 || '普通',
    });
  });
  return list;
}

/* ── 追加进输入框 ── */

/** 每个事件各自选中的命运点方式：先点命运点，再点选项，那条选项就带上它 */
const 选点方式 = ref<Record<string, string>>({});

function 选中命运点(事件名: string) {
  return 选点方式.value[事件名] ?? '';
}

// 点选项即往输入框末尾追加一条，带上该事件当前选中的命运点方式
function pickOption(事件名: string, option: { index: number }) {
  选选项(事件名, String(option.index), '', 选中命运点(事件名));
}

// 命运点只受余量限制：先点它、再点选项即可带上
function canUseFate(_事件名: string, cost: number) {
  return 余量.value >= cost;
}

// 再点同一种方式即取消，换一种即改选
function pickFate(事件名: string, 命运点: string) {
  选点方式.value = {
    ...选点方式.value,
    [事件名]: 选中命运点(事件名) === 命运点 ? '' : 命运点,
  };
}

/* ── 「其他」的手写行动 ── */

// 「其他」是手写输入区的开合开关。收起不再撤销已记录的那条：
// 撤销判断同样要在两处维护，去掉它，加错了由玩家自己删
function 切换其他(事件名: string) {
  展开[事件名] = !展开[事件名];
}

// 参数类型取全局的 Event：本文件里的 Event 是事件条目，不是 DOM 事件
function 写手写(事件名: string, event: globalThis.Event) {
  手写[事件名] = (event.target as HTMLTextAreaElement).value;
}

function 确定其他(事件名: string) {
  const 文本 = String(手写[事件名] || '').trim();
  if (!文本) {
    return;
  }
  选选项(事件名, '其他', 文本, 选中命运点(事件名));
}
</script>

<style lang="scss" scoped>
.ls-events {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border-top: 1px solid var(--ls-border);
}

.ls-event-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ls-event {
  padding: 14px 15px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  background: var(--ls-surface);
}

@media (hover: hover) {
  .ls-event:hover {
    border-color: var(--ls-border-strong);
  }
}

.ls-event-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ls-event-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ls-text);
}

.ls-event-time,
.ls-event-deadline {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ls-bg-alt);
  color: var(--ls-text-muted);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.ls-event-theme {
  font-size: 12px;
  color: var(--ls-text-faint);
}

.ls-event-detail {
  margin-top: 6px;
  font-family: var(--ls-f-serif);
  font-size: 14px;
  line-height: 1.75;
  color: var(--ls-text-body);
}

.ls-event-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.ls-option {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  cursor: pointer;
  text-align: left;
}

@media (hover: hover) {
  .ls-option:hover:not(:disabled) {
    background: var(--ls-surface-sunken);
    border-color: var(--ls-border-strong);
  }
}

/* 点选只往输入框追加一条，按钮不留选中态；按下时给一次瞬时反馈 */
.ls-option:active:not(:disabled) {
  border-color: var(--ls-border-strong);
  background: var(--ls-surface-sunken);
}

.ls-option:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ls-option-index {
  flex: none;
  min-width: 13px;
  color: var(--ls-text-faint);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.ls-option-act {
  flex: 1 1 auto;
  font-size: 13.5px;
  color: var(--ls-text);
}

@media (hover: hover) {
  .ls-option:hover:not(:disabled) .ls-option-act {
    color: var(--ls-accent-hover);
  }
}

.ls-option-difficulty {
  flex: none;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--ls-bg-alt);
  color: var(--ls-text-muted);
  font-size: 11px;
  white-space: nowrap;
}

.ls-option-difficulty[data-level='轻松'],
.ls-option-difficulty[data-level='容易'] {
  color: var(--ls-text-faint);
}

.ls-option-difficulty[data-level='困难'],
.ls-option-difficulty[data-level='极难'] {
  background: var(--ls-accent-soft);
  color: var(--ls-accent-hover);
}

.ls-option-cost {
  flex: none;
  max-width: 45%;
  color: var(--ls-text-faint);
  font-size: 11.5px;
  text-align: right;
}

/* 「其他」的序号位留空，只占宽度，以便与其余选项对齐；它不对应 选项="5" */
.ls-option-other .ls-option-act {
  color: var(--ls-text-muted);
}

.ls-option-other.is-open .ls-option-act {
  color: var(--ls-accent-hover);
}

.ls-other {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 2px;
  padding: 10px 12px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface-sunken);
}

.ls-other-input {
  width: 100%;
  min-height: 58px;
  padding: 8px 10px;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text);
  font-size: 13.5px;
  line-height: 1.65;
  resize: vertical;
}

.ls-other-input::placeholder {
  color: var(--ls-text-faint);
}

.ls-other-input:focus {
  outline: none;
  border-color: var(--ls-accent-line);
}

.ls-other-input:disabled {
  background: var(--ls-bg-alt);
  cursor: not-allowed;
}

.ls-other-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ls-other-hint {
  font-size: 11.5px;
  color: var(--ls-text-faint);
}

.ls-other-save {
  flex: none;
  padding: 4px 14px;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text-body);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-other-save:hover:not(:disabled) {
    border-color: var(--ls-accent-line);
    background: var(--ls-accent-soft);
    color: var(--ls-accent-hover);
  }
}

.ls-other-save:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ls-fate {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--ls-border);
}

.ls-fate-label {
  flex: none;
  color: var(--ls-text-faint);
  font-size: 12px;
  letter-spacing: 0.02em;
}

.ls-fate-actions {
  display: flex;
  flex: 1 1 auto;
  gap: 6px;
  flex-wrap: wrap;
}

.ls-fate-btn {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 5px;
  flex: 1 1 auto;
  padding: 6px 10px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  cursor: pointer;
}

@media (hover: hover) {
  .ls-fate-btn:hover:not(:disabled) {
    border-color: var(--ls-accent-line);
    background: var(--ls-accent-soft);
  }
}

.ls-fate-btn.is-picked {
  border-color: var(--ls-accent-line);
  background: var(--ls-accent-soft);
}

.ls-fate-btn:disabled {
  background: var(--ls-surface-sunken);
  cursor: not-allowed;
  opacity: 0.55;
}

.ls-fate-act {
  font-size: 12.5px;
  color: var(--ls-text-body);
  white-space: nowrap;
}

.ls-fate-btn.is-picked .ls-fate-act {
  color: var(--ls-accent-hover);
}

@media (hover: hover) {
  .ls-fate-btn:hover:not(:disabled) .ls-fate-act {
    color: var(--ls-accent-hover);
  }
}

.ls-fate-cost {
  font-size: 11px;
  color: var(--ls-text-faint);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

@media (max-width: 480px) {
  /* 窄屏改为两行：序号、难度、动作占第一行，代价整行缩进到动作起点 */
  .ls-option {
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .ls-option-index {
    order: 1;
  }

  .ls-option-difficulty {
    order: 2;
  }

  .ls-option-act {
    order: 3;
  }

  .ls-option-cost {
    order: 4;
    /* 不收缩地占满一整行；主样式的 max-width 45% 必须在这里放开，否则代价文字会被挤成三行 */
    flex: 0 0 100%;
    max-width: none;
    /* 缩进到动作起点：序号 13px + 间距 8px + 难度标签 36px + 间距 8px */
    padding-left: 65px;
    text-align: left;
  }

  .ls-fate-label {
    flex: 1 1 100%;
  }

  .ls-fate-btn {
    padding: 5px 7px;
    gap: 4px;
  }

  .ls-fate-act {
    font-size: 12px;
  }

  .ls-fate-cost {
    font-size: 10.5px;
  }
}
</style>
