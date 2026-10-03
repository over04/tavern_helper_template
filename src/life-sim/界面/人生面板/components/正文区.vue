<template>
  <section class="ls-reader" :style="阅读样式">
    <div ref="滚动容器" class="ls-reader-scroll" @scroll="处理滚动">
      <div class="ls-reader-column">
        <div class="ls-reader-top">
          <button v-if="可以加载更早" class="ls-reader-more" type="button" :disabled="正在加载" @click="加载更早">
            {{ 正在加载 ? '正在加载更早的楼层…' : '加载更早的楼层' }}
          </button>
          <p v-else class="ls-reader-hint">已经是最早的楼层</p>
        </div>

        <p v-if="渲染列表.length === 0" class="ls-reader-hint">还没有消息</p>

        <FloorItem v-for="项 in 渲染列表" :key="项.楼层号" :楼层="项" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 组件标签名不能用中文（HTML 标签名的首字符必须是 ASCII 字母），导入时取英文名
import FloorItem from './楼层条.vue';
import { onMounted, onUnmounted } from 'vue';
import { 读快照, 读楼层, 变量版本 } from '../正文';
import type { 楼层结构 } from '../正文';
import { 回看数据, 回看层 } from '../回看';
import { 设置状态 } from '../设置';
import type { 设置 } from '../设置';

/** 首屏渲染的楼层条数 */
const 首屏条数 = 10;
/** 每次向上加载的楼层条数 */
const 每批条数 = 20;
/** 距底部多少像素以内算作停在底部 */
const 底部临界距离 = 80;

const 滚动容器 = ref<HTMLElement | null>(null);
const 楼层表 = ref<楼层结构[]>([]);
const 正在加载 = ref(false);
const 流式文本 = ref<{ 楼层号: number; 文本: string } | null>(null);

// 窄屏占满宽度，宽屏按设置里的列宽上限居中；字号与行高同样取自设置
const 阅读样式 = computed(() => ({
  '--ls-read-width': `${设置状态.value.列宽上限}px`,
  '--ls-read-size': `${设置状态.value.字号}px`,
  '--ls-read-leading': `${设置状态.value.行高}`,
}));

const 可以加载更早 = computed(() => (楼层表.value[0]?.楼层号 ?? 0) > 0);

// 流式回复落在最后一条楼层上，渲染时用收到的文本替换它的原文
const 渲染列表 = computed(() =>
  楼层表.value.map(项 => {
    const 流式 = 流式文本.value;
    return 流式 && 流式.楼层号 === 项.楼层号 ? { ...项, 原文: 流式.文本 } : 项;
  }),
);

/** 内容没变的楼层沿用原对象，避免整表重新渲染 */
function 合并楼层(新表: 楼层结构[], 旧表: 楼层结构[]): 楼层结构[] {
  const 旧索引 = new Map(旧表.map(项 => [项.楼层号, 项]));
  return 新表.map(项 => {
    const 旧 = 旧索引.get(项.楼层号);
    const 未变 =
      旧 !== undefined &&
      旧.原文 === 项.原文 &&
      旧.名称 === 项.名称 &&
      旧.角色 === 项.角色 &&
      旧.隐藏 === 项.隐藏 &&
      旧.消息页 === 项.消息页 &&
      旧.消息页数 === 项.消息页数;
    return 未变 ? 旧 : 项;
  });
}

async function 滚到底() {
  await nextTick();
  const 容器 = 滚动容器.value;
  if (容器) {
    容器.scrollTop = 容器.scrollHeight;
  }
}

function 停在底部(): boolean {
  const 容器 = 滚动容器.value;
  if (!容器) {
    return true;
  }
  return 容器.scrollHeight - 容器.scrollTop - 容器.clientHeight <= 底部临界距离;
}

async function 载入首屏() {
  const 末层 = getLastMessageId();
  if (末层 < 0) {
    楼层表.value = [];
    回看层.value = null;
    回看数据.value = null;
    return;
  }

  const 起 = Math.max(0, 末层 - 首屏条数 + 1);
  楼层表.value = 读楼层(起, 末层 - 起 + 1);
  变量版本.value++;
  await 滚到底();
}

async function 加载更早() {
  if (正在加载.value || !可以加载更早.value) {
    return;
  }

  正在加载.value = true;
  try {
    const 最早 = 楼层表.value[0]?.楼层号 ?? 0;
    const 新起 = Math.max(0, 最早 - 每批条数);
    const 新表 = 读楼层(新起, 最早 - 新起);

    // 记下加载前的滚动高度，加载后把滚动位置补回去，视口内容不会跳动
    const 容器 = 滚动容器.value;
    const 旧高度 = 容器?.scrollHeight ?? 0;
    const 旧位置 = 容器?.scrollTop ?? 0;

    楼层表.value = [...新表, ...楼层表.value];
    变量版本.value++;
    await nextTick();

    if (容器) {
      容器.scrollTop = 容器.scrollHeight - 旧高度 + 旧位置;
    }
  } finally {
    正在加载.value = false;
  }
}

/** 首屏内容不足一屏时继续向上补齐，最多补五批 */
async function 补齐到满屏() {
  for (let 次数 = 0; 次数 < 5; 次数++) {
    const 容器 = 滚动容器.value;
    if (!容器 || 容器.scrollTop > 8 || !可以加载更早.value) {
      return;
    }
    await 加载更早();
  }
}

/** 按当前范围重读一遍，用于消息被改写、切换消息页、变量更新之后 */
function 重读已载() {
  const 旧表 = 楼层表.value;
  const 末层 = getLastMessageId();
  if (旧表.length === 0 || 末层 < 旧表[0].楼层号) {
    void 载入首屏();
    return;
  }

  楼层表.value = 合并楼层(读楼层(旧表[0].楼层号, 末层 - 旧表[0].楼层号 + 1), 旧表);
  变量版本.value++;
}

/**
 * 更新回看状态。
 *
 * 视口顶部最近的一条楼层即当前回看的楼层；停在底部时清空回看，恢复当前状态。
 */
function 更新回看层() {
  const 容器 = 滚动容器.value;
  if (!容器) {
    return;
  }

  if (容器.scrollHeight - 容器.scrollTop - 容器.clientHeight <= 6) {
    if (回看层.value !== null) {
      回看层.value = null;
      回看数据.value = null;
    }
    return;
  }

  let 命中: HTMLElement | null = null;
  for (const 节点 of 容器.querySelectorAll<HTMLElement>('[data-楼层]')) {
    if (节点.offsetTop + 节点.offsetHeight > 容器.scrollTop + 1) {
      命中 = 节点;
      break;
    }
  }
  if (!命中) {
    return;
  }

  const 楼层号 = Number(命中.dataset.楼层);
  if (!Number.isFinite(楼层号) || 楼层号 === 回看层.value) {
    return;
  }

  回看层.value = 楼层号;
  回看数据.value = 读快照(楼层号);
}

let 滚动待处理 = false;

function 处理滚动() {
  if (滚动待处理) {
    return;
  }

  滚动待处理 = true;
  requestAnimationFrame(() => {
    滚动待处理 = false;
    更新回看层();

    const 容器 = 滚动容器.value;
    if (容器 && 容器.scrollTop <= 8) {
      void 加载更早();
    }
  });
}

let 待合并流式 = '';
let 流式待处理 = false;

/**
 * 接收流式文本。
 *
 * 酒馆的流式事件给的是本次生成的当前全文，酒馆助手的增量事件给的是新增的一段，
 * 两种情况都按「以已有文本开头就是全文，否则就是增量」处理，界面表现为逐字追加。
 */
function 接收流式(文本: string) {
  const 末层 = getLastMessageId();
  if (末层 < 0 || !文本) {
    return;
  }

  const 已有 = 流式文本.value;
  const 当前 = 已有 && 已有.楼层号 === 末层 ? 已有.文本 : '';
  待合并流式 = 当前 && !文本.startsWith(当前) ? 当前 + 文本 : 文本;

  if (流式待处理) {
    return;
  }

  流式待处理 = true;
  requestAnimationFrame(() => {
    流式待处理 = false;
    const 楼层号 = getLastMessageId();
    if (楼层号 < 0 || 待合并流式 === 流式文本.value?.文本) {
      return;
    }

    流式文本.value = { 楼层号, 文本: 待合并流式 };
    if (停在底部()) {
      void 滚到底();
    }
  });
}

/** 流式结束后把收到的文本换成读到的楼层原文 */
function 结束流式() {
  if (!流式文本.value) {
    return;
  }
  流式文本.value = null;
  重读已载();
}

const 监听表: Array<() => void> = [];

function 监听(事件: EventType, 处理: (...参数: any[]) => void) {
  监听表.push(eventOn(事件, 处理).stop);
}

onMounted(async () => {
  await 载入首屏();
  await 补齐到满屏();

  监听(tavern_events.STREAM_TOKEN_RECEIVED, (文本: string) => 接收流式(文本));
  监听(tavern_events.GENERATION_STOPPED, () => 结束流式());

  监听(tavern_events.MESSAGE_RECEIVED, () => {
    const 原本停在底部 = 停在底部();
    // 流式结束，正文换回读到的楼层原文
    流式文本.value = null;
    重读已载();
    if (原本停在底部) {
      void 滚到底();
    }
  });

  监听(tavern_events.MESSAGE_SENT, () => {
    重读已载();
    void 滚到底();
  });

  [tavern_events.MESSAGE_EDITED, tavern_events.MESSAGE_DELETED, tavern_events.MESSAGE_SWIPED].forEach(事件 =>
    监听(事件, () => 重读已载()),
  );

  // 变量表更新后重读，判定复核脚本写下的成败与复核说明才会显示出来
  监听(tavern_events.MESSAGE_UPDATED, () => 重读已载());
  if (typeof Mvu !== 'undefined') {
    监听(Mvu.events.VARIABLE_UPDATE_ENDED, () => 重读已载());
  }

  监听(tavern_events.CHAT_CHANGED, () => {
    void 载入首屏().then(补齐到满屏);
  });
});

onUnmounted(() => {
  监听表.forEach(停 => 停());
  监听表.length = 0;
  回看层.value = null;
  回看数据.value = null;
});
</script>

<style lang="scss" scoped>
.ls-reader {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.ls-reader-scroll {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.ls-reader-column {
  width: 100%;
  max-width: var(--ls-read-width, 760px);
  margin: 0 auto;
  padding: 12px 16px 20px;
}

.ls-reader-top {
  display: flex;
  justify-content: center;
  min-height: 24px;
  margin-bottom: 8px;
}

.ls-reader-more {
  padding: 3px 12px;
  border: 1px solid var(--ls-border);
  border-radius: 999px;
  background: var(--ls-surface);
  color: var(--ls-text-muted);
  font-size: 12px;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-reader-more:hover:not(:disabled) {
    color: var(--ls-text);
    border-color: var(--ls-border-strong);
  }
}

.ls-reader-more:disabled {
  cursor: default;
  color: var(--ls-text-faint);
}

.ls-reader-hint {
  color: var(--ls-text-faint);
  font-size: 12px;
  text-align: center;
}

@media (max-width: 480px) {
  .ls-reader-column {
    padding: 8px 12px 16px;
  }
}
</style>
