<template>
  <nav class="ls-nav" :class="纵向 ? 'ls-nav--纵向' : 'ls-nav--横向'" role="tablist" aria-label="一级导航">
    <button
      v-for="项 in 全部项目"
      :key="项.名称"
      class="ls-nav-项目"
      :class="{ 'ls-is-active': modelValue === 项.名称 }"
      type="button"
      role="tab"
      :aria-selected="modelValue === 项.名称"
      @click="$emit('update:modelValue', 项.名称)"
    >
      <i class="ls-nav-图标" :class="项.图标" aria-hidden="true"></i>
      <span class="ls-nav-文字">{{ 项.名称 }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
type 一级名称 = '游戏' | '变量管理' | '设置';

/** 图标由酒馆助手预注入的 FontAwesome 提供 */
const 项目表: { 名称: 一级名称; 图标: string }[] = [
  { 名称: '游戏', 图标: 'fa-solid fa-dice' },
  { 名称: '变量管理', 图标: 'fa-solid fa-table-list' },
  { 名称: '设置', 图标: 'fa-solid fa-gear' },
];

const 属性 = defineProps<{
  modelValue: 一级名称;
  /** 宽屏为 true：最左竖排；窄屏为 false：底部一排 */
  纵向: boolean;
  /** 开局时游戏面板不渲染，游戏页签一并隐藏 */
  隐藏游戏?: boolean;
}>();

const 全部项目 = computed(() =>
  属性.隐藏游戏 ? 项目表.filter(项 => 项.名称 !== '游戏') : 项目表,
);

defineEmits<{ 'update:modelValue': [名称: 一级名称] }>();
</script>

<style lang="scss" scoped>
.ls-nav {
  display: flex;
  gap: 4px;
}

.ls-nav-项目 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--ls-r-sm);
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-nav-项目:hover {
    color: var(--ls-text);
  }
}

.ls-nav-图标 {
  font-size: 15px;
  line-height: 1;
}

.ls-nav-文字 {
  line-height: 1.2;
  white-space: nowrap;
}

/* ── 纵向：最左竖排，图标在上、文字在下 ── */
.ls-nav--纵向 {
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: var(--ls-surface);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
}

.ls-nav--纵向 .ls-nav-项目 {
  flex-direction: column;
  gap: 5px;
  width: 62px;
  padding: 10px 2px;
}

/* ── 横向：底部一排，图标与文字同排 ── */
.ls-nav--横向 {
  flex-direction: row;
  align-items: stretch;
  height: 100%;
}

.ls-nav--横向 .ls-nav-项目 {
  flex: 1;
  flex-direction: row;
  gap: 6px;
  padding: 0 4px;
}

/* ── 选中态 ── */
.ls-nav-项目.ls-is-active {
  background: var(--ls-accent-soft);
  color: var(--ls-accent-hover);
}

.ls-nav-项目.ls-is-active .ls-nav-图标 {
  color: var(--ls-accent);
}
</style>
