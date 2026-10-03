<template>
  <article class="ls-floor" :class="{ 'ls-is-user': 楼层.角色 === 'user' }" :data-楼层="楼层.楼层号">
    <header class="ls-floor-head">
      <span class="ls-floor-name">{{ 楼层.名称 }}</span>
      <span class="ls-floor-id">第 {{ 楼层.楼层号 }} 层</span>

      <!-- 工具行常驻：只有图标，说明文字作为 title 属性 -->
      <div class="ls-floor-tools">
        <template v-if="楼层.消息页数 > 1">
          <button class="ls-floor-tool" type="button" title="上一个消息页" @click="切消息页(-1)">
            <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>
          <span class="ls-floor-swipe">{{ 楼层.消息页 + 1 }}/{{ 楼层.消息页数 }}</span>
          <button class="ls-floor-tool" type="button" title="下一个消息页" @click="切消息页(1)">
            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
        </template>

        <button class="ls-floor-tool" type="button" title="重新生成本层" @click="重新生成">
          <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
        </button>
        <button v-if="是最后一层" class="ls-floor-tool" type="button" title="编辑最后一层" @click="编辑本层">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button>
        <button class="ls-floor-tool" type="button" title="回滚到这里" @click="回滚到这里">
          <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
        </button>
        <button class="ls-floor-tool" type="button" title="从这里创建分支" @click="创建分支">
          <i class="fa-solid fa-code-branch" aria-hidden="true"></i>
        </button>
      </div>
    </header>

    <div class="ls-floor-body">
      <template v-for="(片段, 下标) in 片段表" :key="下标">
        <VerdictBar v-if="片段.类型 === '判定'" :序号="片段.序号" />
        <!-- 正文按酒馆的显示格式渲染，内容本身就是 HTML -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-else-if="片段.内容" class="ls-floor-text" v-html="片段.内容"></div>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
// 组件标签名不能用中文（HTML 标签名的首字符必须是 ASCII 字母），导入时取英文名
import VerdictBar from './判定条.vue';
import { 切判定标签, 剔占位符, 转显示, 变量版本, 楼层上下文键 } from '../正文';
import type { 楼层结构 } from '../正文';
import { 取宿主文档 } from '../全屏';

const props = defineProps<{ 楼层: 楼层结构 }>();

// 判定条按注入的楼层取自己那一条判定，并跟着变量版本刷新
provide(楼层上下文键, {
  楼层: computed(() => props.楼层),
  变量版本,
});

const 是最后一层 = computed(() => props.楼层.楼层号 === getLastMessageId());

// 正文原文先剔除状态栏占位符，再切出判定片段，其余文本片段才交给酒馆显示格式转换
const 片段表 = computed(() =>
  切判定标签(剔占位符(props.楼层.原文)).map(片段 =>
    片段.类型 === '文本' ? { 类型: '文本' as const, 内容: 转显示(片段.内容, props.楼层.楼层号) } : 片段,
  ),
);

/** 确认框用宿主窗口那一份：界面在楼层 iframe 里，弹窗要出现在酒馆那一层 */
function 确认(文本: string): boolean {
  const 视图 = 取宿主文档().defaultView;
  return 视图 ? 视图.confirm(文本) : false;
}

async function 切消息页(方向: number) {
  const 总数 = props.楼层.消息页数;
  if (总数 <= 1) {
    return;
  }

  const 目标 = (props.楼层.消息页 + 方向 + 总数) % 总数;
  await setChatMessages([{ message_id: props.楼层.楼层号, swipe_id: 目标 }], { refresh: 'affected' });
}

async function 重新生成() {
  const 楼层号 = props.楼层.楼层号;
  if (楼层号 === getLastMessageId()) {
    await triggerSlash('/regenerate');
    return;
  }

  // 酒馆原版只对最后一层提供重新生成，历史楼层先回滚到该层再重新生成
  if (!确认('重新生成本层会删除这一层之后的消息，继续吗？')) {
    return;
  }

  const 末层 = getLastMessageId();
  if (末层 > 楼层号) {
    await deleteChatMessages(_.range(楼层号 + 1, 末层 + 1), { refresh: 'affected' });
  }
  await triggerSlash('/regenerate');
}

function 编辑本层() {
  const 按钮 = 取宿主文档().querySelector<HTMLElement>(`.mes[mesid="${props.楼层.楼层号}"] .mes_edit`);
  if (!按钮) {
    console.warn('人生面板：没有找到酒馆原版的编辑按钮');
    return;
  }
  按钮.click();
}

async function 回滚到这里() {
  const 楼层号 = props.楼层.楼层号;
  const 末层 = getLastMessageId();
  if (末层 <= 楼层号) {
    return;
  }

  if (!确认(`回滚到这里会删除第 ${楼层号 + 1} 层到第 ${末层} 层，继续吗？`)) {
    return;
  }
  await deleteChatMessages(_.range(楼层号 + 1, 末层 + 1), { refresh: 'affected' });
}

async function 创建分支() {
  await triggerSlash(`/branch-create ${props.楼层.楼层号}`);
}
</script>

<style lang="scss" scoped>
.ls-floor {
  position: relative;
  padding: 10px 12px 12px;
  border-radius: var(--ls-r-sm);
}

.ls-floor.ls-is-user {
  background: var(--ls-accent-soft);
}

.ls-floor-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 26px;
  margin-bottom: 6px;
}

.ls-floor-name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ls-text);
}

.ls-floor-id {
  flex: none;
  white-space: nowrap;
  font-size: 11.5px;
  color: var(--ls-text-faint);
  font-variant-numeric: tabular-nums;
}

/* 工具行靠右常驻：图标按钮自身大小即点击区，悬停只改底色与颜色，不动位置 */
.ls-floor-tools {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.ls-floor-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: var(--ls-r-xs);
  background: transparent;
  color: var(--ls-text-faint);
  font-size: 12.5px;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-floor-tool:hover {
    background: var(--ls-bg-alt);
    color: var(--ls-text);
  }
}

.ls-floor-swipe {
  flex: none;
  padding: 0 1px;
  white-space: nowrap;
  color: var(--ls-text-faint);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.ls-floor-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 叙事正文走衬线，字号与行高取设置里的阅读区样式 */
.ls-floor-text {
  font-family: var(--ls-f-serif);
  font-size: var(--ls-read-size, 16px);
  line-height: var(--ls-read-leading, 1.8);
  color: var(--ls-text-body);
  overflow-wrap: anywhere;
}

.ls-floor-text :deep(p) {
  margin: 0 0 0.7em;
}

.ls-floor-text :deep(p:last-child) {
  margin-bottom: 0;
}

.ls-floor-text :deep(em) {
  font-style: italic;
}

.ls-floor-text :deep(strong) {
  font-weight: 600;
  color: var(--ls-text);
}

.ls-floor-text :deep(code) {
  padding: 1px 5px;
  border-radius: var(--ls-r-xs);
  background: var(--ls-bg-alt);
  font-family: var(--ls-f-mono);
  font-size: 0.9em;
}

.ls-floor-text :deep(blockquote) {
  margin: 0 0 0.7em;
  padding-left: 10px;
  border-left: 2px solid var(--ls-border-strong);
  color: var(--ls-text-muted);
}

@media (max-width: 480px) {
  .ls-floor {
    padding: 8px 10px 10px;
  }
}
</style>
