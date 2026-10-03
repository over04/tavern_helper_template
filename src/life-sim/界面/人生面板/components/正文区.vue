<template>
  <section class="ls-reader" :style="阅读样式">
    <div ref="滚动容器" class="ls-reader-scroll">
      <div class="ls-reader-column">
        <p v-if="!展示楼层" class="ls-reader-hint">还没有消息</p>
        <!-- 一次只挂一条楼层，翻页时整条重建，嵌套 iframe 随之重建 -->
        <FloorItem v-else :key="展示楼层.楼层号" :楼层="展示楼层" :末层="末层" @切换楼层="翻页" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 组件标签名不能用中文（HTML 标签名的首字符必须是 ASCII 字母），导入时取英文名
import FloorItem from './楼层条.vue';
import { nextTick, onMounted, onUnmounted, watch } from 'vue';
import { 读快照, 读楼层, 变量版本 } from '../正文';
import type { 楼层结构 } from '../正文';
import { 回看数据, 回看层 } from '../回看';
import { 设置状态 } from '../设置';

/** 距底部多少像素以内算作停在底部 */
const 底部临界距离 = 80;

const 滚动容器 = ref<HTMLElement | null>(null);
/** 聊天里最后一层的楼层号，没有消息时为 -1 */
const 末层 = ref(getLastMessageId());
/** 当前查看的楼层号，没有消息时为 -1 */
const 当前层 = ref(Math.max(0, getLastMessageId()));
const 流式文本 = ref<{ 楼层号: number; 文本: string } | null>(null);

// 窄屏占满宽度，宽屏按设置里的列宽上限居中；字号与行高同样取自设置
const 阅读样式 = computed(() => ({
  '--ls-read-width': `${设置状态.value.列宽上限}px`,
  '--ls-read-size': `${设置状态.value.字号}px`,
  '--ls-read-leading': `${设置状态.value.行高}`,
}));

// 楼层正文只在切换楼层或主动刷新时重读。MVU 变量更新不改动楼层正文，
// 若跟着变量一起重读，整条正文连同嵌套 iframe 会一并重建，正文里的界面
// 还没加载完就被换掉，正文区会一直停在半成品状态。
const 重读版本 = ref(0);

/**
 * 上一次读出来的楼层对象。
 *
 * 楼层没变时必须交回同一个对象：`楼层条` 的嵌套文档是 computed，
 * 它一重算就会重新跑一次酒馆的显示格式转换，而转换每次都会重跑宏，
 * 输出字符串并不完全相同，嵌套 iframe 于是被整个重建一次——表现就是正文区闪。
 */
let 上次楼层: 楼层结构 | null = null;

const 楼层 = computed<楼层结构 | null>(() => {
  void 重读版本.value;

  const 号 = 当前层.value;
  if (号 < 0 || 号 > 末层.value) {
    上次楼层 = null;
    return null;
  }

  const 新楼层 = 读楼层(号, 1)[0] ?? null;
  if (
    新楼层 &&
    上次楼层 &&
    上次楼层.楼层号 === 新楼层.楼层号 &&
    上次楼层.原文 === 新楼层.原文 &&
    上次楼层.消息页 === 新楼层.消息页
  ) {
    return 上次楼层;
  }

  上次楼层 = 新楼层;
  return 新楼层;
});

// 楼层对象原样交给楼层条。流式文本不能塞进来：它每一帧都会生成一个新对象，
// 让嵌套 iframe 的 srcdoc 每帧重设一次，正文里的界面永远加载不完。
// 生成过程由全屏壳的生成浮层体现，流式结束后由 刷新() 把最终正文交回楼层条。
const 展示楼层 = computed(() => 楼层.value);

/**
 * 更新回看状态。
 *
 * 停在最新一条时清空回看，面板显示当前状态；翻到历史楼层时面板显示那一层的快照。
 */
function 同步回看() {
  const 号 = 当前层.value;
  if (号 < 0 || 号 >= 末层.value) {
    回看层.value = null;
    回看数据.value = null;
    return;
  }

  回看层.value = 号;
  回看数据.value = 读快照(号);
}

async function 滚到顶() {
  await nextTick();
  const 容器 = 滚动容器.value;
  if (容器) {
    容器.scrollTop = 0;
  }
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

/** 翻到相邻的一条楼层，越界时停在两端 */
async function 翻页(方向: number) {
  const 上限 = Math.max(0, 末层.value);
  const 新号 = Math.min(Math.max(当前层.value + 方向, 0), 上限);
  if (新号 === 当前层.value) {
    return;
  }

  当前层.value = 新号;
  await 滚到顶();
}

/** 按当前聊天重新定位：原本停在末尾的跟着最新一条走，正在看历史的保持不动 */
function 刷新() {
  const 旧末层 = 末层.value;
  const 新末层 = getLastMessageId();
  const 原本在末尾 = 当前层.value >= 旧末层;
  末层.value = 新末层;

  if (新末层 < 0) {
    当前层.value = -1;
  } else if (原本在末尾) {
    当前层.value = 新末层;
  } else if (当前层.value > 新末层) {
    当前层.value = 新末层;
  }

  重读版本.value++;
}

/** 回到最新一条，用于挂载与切换聊天 */
async function 载入最新() {
  末层.value = getLastMessageId();
  当前层.value = Math.max(0, 末层.value);
  重读版本.value++;
  await 滚到顶();
}

let 待合并流式 = '';
let 流式待处理 = false;

/**
 * 接收流式文本。
 *
 * 酒馆的流式事件给的是本次生成的当前全文，酒馆助手的增量事件给的是新增的一段，
 * 两种情况都按「以已有文本开头就是全文，否则就是增量」处理，界面表现为逐字追加。
 * 新楼层出现时，停在末尾的玩家跟过去，看着它逐字生成。
 */
function 接收流式(文本: string) {
  const 号 = getLastMessageId();
  if (号 < 0 || !文本) {
    return;
  }

  if (号 > 末层.value && 当前层.value >= 末层.value) {
    末层.value = 号;
    当前层.value = 号;
    void 滚到顶();
  }

  const 已有 = 流式文本.value;
  const 当前 = 已有 && 已有.楼层号 === 号 ? 已有.文本 : '';
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
  刷新();
}

const 监听表: Array<() => void> = [];

function 监听(事件: EventType, 处理: (...参数: any[]) => void) {
  监听表.push(eventOn(事件, 处理).stop);
}

// 当前楼层或变量变化后重新读一次回看快照
watch([当前层, 变量版本], 同步回看, { immediate: true });

onMounted(async () => {
  await 载入最新();

  监听(tavern_events.STREAM_TOKEN_RECEIVED, (文本: string) => 接收流式(文本));
  监听(tavern_events.GENERATION_STOPPED, () => 结束流式());

  监听(tavern_events.MESSAGE_RECEIVED, () => {
    // 流式结束，正文换回读到的楼层原文
    流式文本.value = null;
    刷新();
    void 滚到顶();
  });

  监听(tavern_events.MESSAGE_SENT, () => {
    刷新();
    void 滚到顶();
  });

  [tavern_events.MESSAGE_EDITED, tavern_events.MESSAGE_DELETED, tavern_events.MESSAGE_SWIPED].forEach(事件 =>
    监听(事件, () => 刷新()),
  );

  // 变量表更新后只推进变量版本，让回看快照与判定条重新读一次。
  // 正文没有变，这里不能走 刷新()：那会重读正文并重设嵌套 iframe 的 srcdoc，
  // 而酒馆的显示格式转换每次都会重跑宏，输出字符串并不完全相同，
  // 于是整条正文连同正文里的界面被反复重建，表现就是正文区一直闪。
  监听(tavern_events.MESSAGE_UPDATED, () => {
    变量版本.value++;
  });
  if (typeof Mvu !== 'undefined') {
    监听(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
      变量版本.value++;
    });
  }

  监听(tavern_events.CHAT_CHANGED, () => {
    void 载入最新();
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
