<script lang="ts">
/** 字段的取值类型，决定给什么控件 */
export type 字段类型 = 'number' | 'enum' | 'boolean' | 'string' | 'object' | 'array';

/** 一个字段的编辑元数据：控件类型、取值范围与子字段结构 */
export type 字段结构 = {
  /** 控件类型 */
  结构: 字段类型;
  /** 数值的允许下限 */
  下限?: number;
  /** 数值的允许上限 */
  上限?: number;
  /** 数值每次增减的步长 */
  步长?: number;
  /** 枚举的可选值 */
  枚举?: string[];
  /** 字符串是否用双行文本域 */
  长文本?: boolean;
  /** 对象的固定子字段，键为字段名 */
  子字段?: Record<string, 字段结构>;
  /** 动态键对象的值结构，或数组的元素结构 */
  值结构?: 字段结构;
  /** 对象的键是否由数据决定，可改名与增删 */
  动态?: boolean;
  /** 数组的条目数上限 */
  条目上限?: number;
  /** 字段的显示名，缺省时用键名 */
  标签?: string;
  /** 字段旁的补充说明 */
  说明?: string;
  /** 由脚本写入，界面只读 */
  只读?: boolean;
};
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';

defineOptions({ name: 'FieldControl' });

const props = withDefaults(
  defineProps<{
    /** 字段在 stat_data 里的完整路径，如「状态.健康」 */
    路径: string;
    /** 字段当前的值 */
    值: any;
    /** 控件类型 */
    结构: 字段类型;
    /** 字段的显示名 */
    标签: string;
    /** 数值的允许下限 */
    下限?: number;
    /** 数值的允许上限 */
    上限?: number;
    /** 数值每次增减的步长 */
    步长?: number;
    /** 枚举的可选值 */
    枚举?: string[];
    /** 字符串是否用双行文本域 */
    长文本?: boolean;
    /** 对象的固定子字段 */
    子字段?: Record<string, 字段结构>;
    /** 动态键对象的值结构，或数组的元素结构 */
    值结构?: 字段结构;
    /** 对象的键是否由数据决定 */
    动态?: boolean;
    /** 数组的条目数上限 */
    条目上限?: number;
    /** 字段旁的补充说明 */
    说明?: string;
    /** 由脚本写入，界面只读 */
    只读?: boolean;
    /** 分组字段初次渲染时是否收起 */
    默认折叠?: boolean;
  }>(),
  {
    步长: 1,
    长文本: false,
    动态: false,
    只读: false,
    默认折叠: false,
    下限: undefined,
    上限: undefined,
    枚举: undefined,
    子字段: undefined,
    值结构: undefined,
    条目上限: undefined,
    说明: undefined,
  },
);

const emit = defineEmits<{ update: [载荷: { 路径: string; 值: any }] }>();

/** 叶子字段直接给控件，分组字段给折叠区 */
const 是叶子 = computed(() => ['number', 'enum', 'boolean', 'string'].includes(props.结构));

const 展开 = ref(!props.默认折叠);

/** 固定子字段只用于键固定的对象 */
const 固定子字段 = computed(() => (props.结构 === 'object' && !props.动态 ? props.子字段 : undefined));

/** 值结构本身是对象时，条目内部直接铺开它的子字段，避免多一层折叠 */
const 值子字段 = computed(() => {
  const 结构 = props.值结构;
  return 结构 && 结构.结构 === 'object' ? 结构.子字段 : undefined;
});

const 条目列表 = computed(() => {
  const 原值 = props.值 ?? {};
  if (Array.isArray(原值)) {
    return 原值.map((项: any, 序: number) => ({ 键: String(序), 序, 值: 项, 可改名: false }));
  }
  return Object.entries(原值 as Record<string, any>).map(([键, 项]) => ({ 键, 序: -1, 值: 项, 可改名: true }));
});

const 计数 = computed(() => (固定子字段.value ? 0 : 条目列表.value.length));

const 可增条目 = computed(() => !props.条目上限 || 条目列表.value.length < props.条目上限);

/** 枚举里没有当前值时，补一项把它显示出来，避免下拉显示为空 */
const 枚举外 = computed(() => !!props.值 && !(props.枚举 ?? []).includes(props.值));

function 取子(容器: any, 键: string) {
  return (容器 ?? {})[键];
}

function 提交(值: any) {
  emit('update', { 路径: props.路径, 值 });
}

function 夹取(数: number) {
  let 结果 = 数;
  if (typeof props.下限 === 'number') {
    结果 = Math.max(props.下限, 结果);
  }
  if (typeof props.上限 === 'number') {
    结果 = Math.min(props.上限, 结果);
  }
  return 结果;
}

function 兜底数() {
  return typeof props.下限 === 'number' ? props.下限 : 0;
}

/** 输入过程中只写回完整且范围内的值，中间态与越界值等失焦时再统一处理 */
function 数输入(事件: Event) {
  if (props.只读) {
    return;
  }
  const 原文 = (事件.target as HTMLInputElement).value.trim();
  if (原文 === '') {
    return;
  }
  const 数 = Number(原文);
  if (!Number.isFinite(数) || String(数) !== 原文 || 数 !== 夹取(数)) {
    return;
  }
  提交(数);
}

function 数提交(事件: Event) {
  if (props.只读) {
    return;
  }
  const 输入 = 事件.target as HTMLInputElement;
  const 原文 = 输入.value.trim();
  const 数 = 原文 === '' ? 兜底数() : Number(原文);
  const 结果 = 夹取(Number.isFinite(数) ? 数 : 兜底数());
  输入.value = String(结果);
  提交(结果);
}

function 选提交(事件: Event) {
  if (props.只读) {
    return;
  }
  提交((事件.target as HTMLSelectElement).value);
}

function 文提交(事件: Event) {
  if (props.只读) {
    return;
  }
  提交((事件.target as HTMLInputElement | HTMLTextAreaElement).value);
}

function 改键(旧键: string, 事件: Event) {
  if (props.只读) {
    return;
  }
  const 输入 = 事件.target as HTMLInputElement;
  const 新键 = 输入.value.trim();
  const 现有 = (props.值 ?? {}) as Record<string, any>;
  if (!新键 || 新键 === 旧键 || Object.prototype.hasOwnProperty.call(现有, 新键)) {
    输入.value = 旧键;
    return;
  }
  const 新对象: Record<string, any> = {};
  for (const [键, 项] of Object.entries(现有)) {
    新对象[键 === 旧键 ? 新键 : 键] = 项;
  }
  提交(新对象);
}

function 删条目(键: string) {
  if (Array.isArray(props.值)) {
    提交(props.值.filter((_: any, 序: number) => String(序) !== 键));
    return;
  }
  const 新对象: Record<string, any> = {};
  for (const [旧键, 项] of Object.entries((props.值 ?? {}) as Record<string, any>)) {
    if (旧键 !== 键) {
      新对象[旧键] = 项;
    }
  }
  提交(新对象);
}

function 默认值(结构?: 字段结构): any {
  if (!结构) {
    return null;
  }
  switch (结构.结构) {
    case 'number':
      return 结构.下限 ?? 0;
    case 'enum':
      return 结构.枚举?.[0] ?? '';
    case 'boolean':
      return false;
    case 'string':
      return '';
    case 'array':
      return [];
    default:
      if (结构.动态) {
        return {};
      }
      return Object.fromEntries(Object.entries(结构.子字段 ?? {}).map(([键, 子]) => [键, 默认值(子)]));
  }
}

function 增条目() {
  if (Array.isArray(props.值)) {
    提交([...(props.值 ?? []), 默认值(props.值结构)]);
    return;
  }
  const 现有 = (props.值 ?? {}) as Record<string, any>;
  let 名 = '新条目';
  let 序 = 2;
  while (Object.prototype.hasOwnProperty.call(现有, 名)) {
    名 = `新条目${序}`;
    序 += 1;
  }
  提交({ ...现有, [名]: 默认值(props.值结构) });
}

function 转发(载荷: { 路径: string; 值: any }) {
  emit('update', 载荷);
}
</script>

<template>
  <div class="ls-field">
    <!-- 叶子字段：一行标签加控件 -->
    <div v-if="是叶子" class="ls-row" :class="{ 'ls-row-bare': !标签 }">
      <span v-if="标签" class="ls-row-label">
        {{ 标签 }}
        <span v-if="说明" class="ls-hint">{{ 说明 }}</span>
      </span>

      <div class="ls-row-input">
        <input
          v-if="结构 === 'number'"
          class="ls-num"
          type="number"
          :value="值 ?? 0"
          :min="下限"
          :max="上限"
          :step="步长"
          :disabled="只读"
          @input="数输入"
          @change="数提交"
        />

        <select v-else-if="结构 === 'enum'" class="ls-select" :value="值" :disabled="只读" @change="选提交">
          <option v-if="枚举外" :value="值">{{ 值 }}</option>
          <option v-for="项 in 枚举 ?? []" :key="项" :value="项">{{ 项 === '' ? '未声明' : 项 }}</option>
        </select>

        <button
          v-else-if="结构 === 'boolean'"
          class="ls-switch"
          :class="{ 'ls-switch-on': !!值 }"
          type="button"
          role="switch"
          :aria-checked="!!值"
          :disabled="只读"
          @click="提交(!值)"
        >
          <span class="ls-knob"></span>
        </button>

        <textarea
          v-else-if="长文本"
          class="ls-text ls-textarea"
          rows="2"
          :value="值 ?? ''"
          :disabled="只读"
          @change="文提交"
        ></textarea>

        <input v-else class="ls-text" type="text" :value="值 ?? ''" :disabled="只读" @change="文提交" />

        <span v-if="只读" class="ls-badge">脚本写入</span>
      </div>
    </div>

    <!-- 分组字段：可折叠 -->
    <section v-else class="ls-group">
      <button class="ls-group-head" type="button" :aria-expanded="展开" @click="展开 = !展开">
        <span class="ls-caret" :class="{ 'ls-caret-open': 展开 }" aria-hidden="true"></span>
        <span class="ls-group-name">{{ 标签 }}</span>
        <span v-if="只读" class="ls-badge">脚本写入</span>
        <span v-if="说明" class="ls-hint">{{ 说明 }}</span>
        <span v-if="!固定子字段" class="ls-group-count">{{ 计数 }} 项</span>
      </button>

      <div v-if="展开" class="ls-group-body">
        <!-- 键固定的对象：逐个子字段渲染 -->
        <template v-if="固定子字段">
          <FieldControl
            v-for="(子, 键) in 固定子字段"
            :key="键"
            v-bind="子"
            :路径="`${路径}.${键}`"
            :值="取子(值, 键)"
            :标签="子.标签 ?? 键"
            :只读="只读 || !!子.只读"
            @update="转发"
          />
        </template>

        <!-- 动态键的对象与数组：逐条渲染，可改名与增删 -->
        <template v-else>
          <div v-for="条目 in 条目列表" :key="条目.键" class="ls-entry">
            <div class="ls-entry-head">
              <input
                v-if="条目.可改名"
                class="ls-key"
                type="text"
                :value="条目.键"
                :disabled="只读"
                @change="改键(条目.键, $event)"
              />
              <span v-else class="ls-key-text">第 {{ 条目.序 + 1 }} 条</span>
              <button v-if="!只读" class="ls-del" type="button" @click="删条目(条目.键)">删除</button>
            </div>

            <div class="ls-entry-body">
              <template v-if="值子字段">
                <FieldControl
                  v-for="(子, 子键) in 值子字段"
                  :key="子键"
                  v-bind="子"
                  :路径="`${路径}.${条目.键}.${子键}`"
                  :值="取子(条目.值, 子键)"
                  :标签="子.标签 ?? 子键"
                  :只读="只读 || !!子.只读"
                  @update="转发"
                />
              </template>

              <FieldControl
                v-else-if="值结构"
                v-bind="值结构"
                :路径="`${路径}.${条目.键}`"
                :值="条目.值"
                :标签="''"
                :只读="只读 || !!值结构.只读"
                @update="转发"
              />
            </div>
          </div>

          <p v-if="!条目列表.length" class="ls-empty">暂无条目</p>

          <button v-if="!只读 && 可增条目" class="ls-add" type="button" @click="增条目">新增一项</button>
          <p v-else-if="!只读 && !可增条目" class="ls-empty">已达 {{ 条目上限 }} 项上限</p>
        </template>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.ls-field {
  display: flex;
  flex-direction: column;
}

/* ── 叶子字段 ── */

.ls-row {
  display: grid;
  grid-template-columns: minmax(96px, 140px) minmax(0, 1fr);
  align-items: start;
  gap: 4px 12px;
  padding: 6px 0;
}

.ls-row + .ls-row {
  border-top: 1px solid var(--ls-border);
}

.ls-row-bare {
  grid-template-columns: minmax(0, 1fr);
}

.ls-row-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 5px;
  font-size: 12.5px;
  color: var(--ls-text-body);
  word-break: break-word;
}

.ls-row-input {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ls-num,
.ls-text,
.ls-select {
  width: 100%;
  min-width: 0;
  padding: 5px 9px;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text);
  font-size: 13px;
  line-height: 1.5;
}

.ls-num {
  max-width: 132px;
  font-variant-numeric: tabular-nums;
}

.ls-select {
  max-width: 190px;
  cursor: pointer;
}

.ls-textarea {
  resize: vertical;
  font-family: var(--ls-f-ui);
}

.ls-num:focus,
.ls-text:focus,
.ls-select:focus {
  border-color: var(--ls-accent);
  box-shadow: 0 0 0 3px var(--ls-accent-soft);
  outline: none;
}

.ls-num:disabled,
.ls-text:disabled,
.ls-select:disabled {
  border-color: var(--ls-border);
  background: var(--ls-surface-sunken);
  color: var(--ls-text-muted);
  cursor: not-allowed;
}

/* 开关 */
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

.ls-switch:disabled {
  background: var(--ls-border);
  cursor: not-allowed;
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

/* ── 分组字段 ── */

.ls-group {
  display: flex;
  flex-direction: column;
}

.ls-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface-sunken);
  color: var(--ls-text);
  font-size: 12.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-group-head:hover {
    background: var(--ls-surface-hover);
    border-color: var(--ls-border-strong);
  }
}

.ls-caret {
  flex: none;
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 5px solid var(--ls-text-faint);
}

.ls-caret-open {
  border-left-color: var(--ls-accent);
  transform: rotate(90deg);
}

.ls-group-name {
  min-width: 0;
  word-break: break-word;
}

.ls-group-count {
  margin-left: auto;
  flex: none;
  color: var(--ls-text-faint);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.ls-group-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0 4px 10px;
  border-left: 1px solid var(--ls-border);
  margin-left: 5px;
}

/* ── 动态条目 ── */

.ls-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
}

.ls-entry-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ls-key {
  flex: 1;
  min-width: 0;
  padding: 2px 0;
  border: none;
  border-bottom: 1px dashed var(--ls-border-strong);
  background: transparent;
  color: var(--ls-text);
  font-size: 12.5px;
  font-weight: 600;
}

@media (hover: hover) {
  .ls-key:hover {
    border-bottom-color: var(--ls-text-faint);
  }
}

.ls-key:focus {
  border-bottom-color: var(--ls-accent);
  outline: none;
}

.ls-key:disabled {
  border-bottom-color: transparent;
  color: var(--ls-text-muted);
  cursor: not-allowed;
}

.ls-key-text {
  flex: 1;
  min-width: 0;
  color: var(--ls-text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.ls-del {
  flex: none;
  padding: 2px 8px;
  border: none;
  border-radius: var(--ls-r-xs);
  background: transparent;
  color: var(--ls-text-faint);
  font-size: 11.5px;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-del:hover {
    background: var(--ls-alarm-soft);
    color: var(--ls-alarm);
  }
}

.ls-add {
  align-self: flex-start;
  padding: 5px 12px;
  border: 1px dashed var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 12px;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-add:hover {
    border-color: var(--ls-accent-line);
    background: var(--ls-accent-soft);
    color: var(--ls-accent-hover);
  }
}

/* ── 辅助 ── */

.ls-badge {
  flex: none;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--ls-caution-soft);
  color: var(--ls-caution);
  font-size: 10.5px;
  white-space: nowrap;
}

.ls-hint {
  color: var(--ls-text-faint);
  font-size: 11.5px;
  font-weight: 400;
  line-height: 1.5;
}

.ls-empty {
  padding: 4px 0;
  color: var(--ls-text-faint);
  font-size: 12px;
}

@media (max-width: 719px) {
  .ls-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .ls-row-label {
    padding-top: 0;
  }

  .ls-num,
  .ls-select {
    max-width: none;
  }
}
</style>
