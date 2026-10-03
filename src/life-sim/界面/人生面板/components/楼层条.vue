<template>
  <article class="ls-floor" :class="{ 'ls-is-user': 楼层.角色 === 'user' }">
    <header class="ls-floor-head">
      <span class="ls-floor-name">{{ 楼层.名称 }}</span>

      <!-- 一次只显示一条楼层，翻页按钮与楼层号放在头部 -->
      <div class="ls-floor-pager">
        <button
          class="ls-floor-tool"
          type="button"
          title="上一层"
          aria-label="上一层"
          :disabled="楼层.楼层号 <= 0"
          @click="翻页(-1)"
        >
          <i class="fa-solid fa-chevron-up" aria-hidden="true"></i>
        </button>
        <span class="ls-floor-id">第 {{ 楼层.楼层号 }} 层</span>
        <button
          class="ls-floor-tool"
          type="button"
          title="下一层"
          aria-label="下一层"
          :disabled="楼层.楼层号 >= 末层"
          @click="翻页(1)"
        >
          <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        </button>
      </div>

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

    <!-- 整条楼层交给嵌套 iframe 渲染：正文里的脚本只有在真 iframe 里才会执行。
         这个 iframe 必须由模板创建，写在 v-html 的字符串里会被酒馆的清洗剥掉。
         高度不在这里设，由嵌套文档自己按内容高度回写。 -->
    <iframe
      class="ls-floor-frame"
      :title="`第 ${楼层.楼层号} 层正文`"
      frameborder="0"
      :srcdoc="嵌套文档"
    ></iframe>
  </article>
</template>

<script setup lang="ts">
import { 转未清洗显示 } from '../正文';
import type { 楼层结构 } from '../正文';
import { 拼嵌套文档 } from '../嵌套楼层';
import { 设置状态 } from '../设置';
import { 取宿主文档 } from '../全屏';

const props = defineProps<{ 楼层: 楼层结构; 末层: number }>();
const 发出 = defineEmits<{ 切换楼层: [方向: number] }>();

const 是最后一层 = computed(() => props.楼层.楼层号 === getLastMessageId());

/**
 * 嵌套文档缓存。
 *
 * 拼一次要跑酒馆的显示格式转换，而转换每次都会重跑宏，同一份原文拼出来的字符串并不完全相同。
 * srcdoc 一变，嵌套 iframe 就整个重建，正文里的界面永远停在半成品状态，表现就是正文区反复闪。
 * 按输入缓存结果：输入没变就交回同一个字符串，Vue 也就不会去动 srcdoc。
 */
let 缓存键 = '';
let 缓存值 = '';

const 嵌套文档 = computed(() => {
  const 楼层 = props.楼层;
  const 字号 = 设置状态.value.字号;
  const 行高 = 设置状态.value.行高;
  const 键 = [楼层.楼层号, 楼层.消息页, 字号, 行高, 楼层.原文].join('\u0000');
  if (键 === 缓存键) {
    return 缓存值;
  }
  缓存键 = 键;
  缓存值 = 拼嵌套文档(转未清洗显示(楼层), 字号, 行高);
  return 缓存值;
});

function 翻页(方向: number) {
  发出('切换楼层', 方向);
}

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

/* 翻页组靠左紧跟在名称之后：两个按钮夹住楼层号，一眼看出当前在哪一层 */
.ls-floor-pager {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  margin-left: auto;
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
  .ls-floor-tool:hover:not(:disabled) {
    background: var(--ls-bg-alt);
    color: var(--ls-text);
  }
}

.ls-floor-tool:disabled {
  cursor: default;
  color: var(--ls-border-strong);
}

.ls-floor-swipe {
  flex: none;
  padding: 0 1px;
  white-space: nowrap;
  color: var(--ls-text-faint);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

/* 高度不设：嵌套文档按内容高度回写内联样式，写在这里的高度会把它盖掉 */
.ls-floor-frame {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
}

@media (max-width: 480px) {
  .ls-floor {
    padding: 8px 10px 10px;
  }
}
</style>
