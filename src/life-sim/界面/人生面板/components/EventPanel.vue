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
            :class="{ 'is-picked': picks[name]?.index === option.index }"
            type="button"
            @click="pickOption(name, option)"
          >
            <span class="ls-option-index">{{ option.index }}</span>
            <span class="ls-option-act">{{ option.action }}</span>
            <span class="ls-option-difficulty" :data-level="option.level">{{ option.level }}</span>
            <span v-if="option.cost" class="ls-option-cost">{{ option.cost }}</span>
          </button>
        </div>

        <div class="ls-fate">
          <span class="ls-fate-label">命运点</span>
          <div class="ls-fate-actions">
            <button
              v-for="way in FATE_WAYS"
              :key="way.key"
              class="ls-fate-btn"
              :class="{ 'is-picked': picks[name]?.fate === way.key }"
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
import { computed, reactive, watch } from 'vue';
import { appendInput, replaceInput } from '../inject';

type Option = { 动作: string; 代价: string; 难度: string };
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

// 选项键固定为 一~四：界面显示的序号即判定脚本取用 stat.事件[名].选项[键] 的序号，两处必须同序
const OPTION_KEYS = ['一', '二', '三', '四'];

const FATE_WAYS = [
  { key: '重掷', label: '重掷', cost: 1 },
  { key: '加值', label: '加值 +20', cost: 2 },
  { key: '改判', label: '改判为成功', cost: 3 },
];

type Pick = { index: number; line: string; fate: string };

const entries = computed(() => Object.entries(props.events ?? {}));

// 每个事件当前选中的选项与命运点声明
const picks = reactive<Record<string, Pick>>({});

// 上一次写进输入框的整段声明，用于原地替换，避免同一事件留下多条互相冲突的声明
let lastInjected = '';

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

function 组装声明() {
  const 段: string[] = [];
  for (const name of Object.keys(picks)) {
    const pick = picks[name];
    if (!pick?.line) {
      continue;
    }
    段.push(pick.fate ? `${pick.line}\n命运点：${pick.fate}` : pick.line);
  }
  return 段.join('\n');
}

function 提交() {
  const 下一段 = 组装声明();
  if (!下一段) {
    return;
  }
  if (lastInjected && replaceInput(lastInjected, 下一段)) {
    lastInjected = 下一段;
    return;
  }
  lastInjected = 下一段;
  appendInput(下一段);
}

function pickOption(name: string, option: { index: number; action: string }) {
  picks[name] = {
    index: option.index,
    line: `「事件」「${name}」选项${option.index}：${option.action}`,
    fate: picks[name]?.fate ?? '',
  };
  提交();
}

// 命运点必须与选项写在同一段文本里，判定脚本才会结算；没点选项时按钮一律置灰
function canUseFate(name: string, cost: number) {
  return Boolean(picks[name]?.line) && 余量.value >= cost;
}

function pickFate(name: string, key: string) {
  const pick = picks[name];
  if (!pick?.line) {
    return;
  }
  picks[name] = { ...pick, fate: key };
  提交();
}

// 事件消失后清掉对应声明，避免残留的旧声明被判定脚本当作本回合的选项
watch(entries, list => {
  const 现存 = new Set(list.map(([name]) => name));
  let 有变化 = false;
  for (const name of Object.keys(picks)) {
    if (!现存.has(name)) {
      delete picks[name];
      有变化 = true;
    }
  }
  if (!有变化 || !lastInjected) {
    return;
  }
  const 下一段 = 组装声明();
  if (下一段 && replaceInput(lastInjected, 下一段)) {
    lastInjected = 下一段;
    return;
  }
  // 输入框已不含上次注入的整段（通常是玩家已发送），放弃追踪
  lastInjected = '';
});
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

.ls-event:hover {
  border-color: var(--ls-border-strong);
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

.ls-option:hover {
  background: var(--ls-surface-sunken);
  border-color: var(--ls-border-strong);
}

.ls-option.is-picked,
.ls-option.is-picked:hover {
  border-color: var(--ls-accent-line);
  background: var(--ls-accent-soft);
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

.ls-option:hover .ls-option-act,
.ls-option.is-picked .ls-option-act {
  color: var(--ls-accent-hover);
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

/* 选中态下把难度标签的底换成白，避免灰底色与橙底色相叠而显得浑浊 */
.ls-option.is-picked .ls-option-difficulty {
  background: var(--ls-surface);
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

.ls-fate-btn:hover:not(:disabled) {
  border-color: var(--ls-accent-line);
  background: var(--ls-accent-soft);
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

.ls-fate-btn:hover:not(:disabled) .ls-fate-act,
.ls-fate-btn.is-picked .ls-fate-act {
  color: var(--ls-accent-hover);
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
