<template>
  <!-- 变量没就绪或渲染出错时给出明确的提示，避免整块界面渲染成空白 -->
  <div v-if="异常" class="ls-变量异常">
    <p class="ls-变量异常-标题">{{ 异常 }}</p>
    <p class="ls-变量异常-说明">若这是导入新卡片之前的旧聊天，请新建聊天后重试。</p>
    <pre v-if="异常详情" class="ls-变量异常-详情">{{ 异常详情 }}</pre>
  </div>

  <!-- 聊天层：面板就是聊天里的一块，点「全屏」由界面把承载它的 iframe 铺满视口 -->
  <div v-else-if="!全屏" class="ls-panel" :class="{ 'ls-fs--动效': 设置.动效 }">
    <div class="ls-panel-头">
      <span class="ls-panel-标题">模拟人生</span>
      <button class="ls-panel-全屏" type="button" title="全屏" aria-label="全屏" @click="切换全屏">
        <i class="fa-solid fa-expand" aria-hidden="true"></i>
      </button>
    </div>
    <!-- 铺满失败时不切进全屏，把现场写在这里：真机上拿不到控制台，这行字就是线索 -->
    <p v-if="全屏失败" class="ls-panel-全屏失败">{{ 全屏失败 }}</p>
    <GamePanel />
  </div>

  <!-- 全屏：顶栏、一级导航与三列主区 -->
  <div v-else class="ls-fs" :class="{ 'ls-fs--动效': 设置.动效 }" :style="阅读区样式">
    <div class="ls-fs-壳">
      <header class="ls-fs-顶栏">
        <span class="ls-fs-标题">模拟人生</span>
        <span class="ls-fs-读数">{{ 读数 }}</span>
        <button
          class="ls-fs-退出按钮"
          type="button"
          title="退出全屏"
          aria-label="退出全屏"
          @click="切换全屏"
        >
          <i class="fa-solid fa-compress" aria-hidden="true"></i>
        </button>
      </header>

      <div class="ls-fs-主体" :class="{ 'ls-fs-主体--抽屉开': 抽屉开 }">
        <div class="ls-fs-导航" @click="点导航">
          <PrimaryNav v-model="一级" :纵向="宽屏" />
        </div>

        <section
          v-if="!正文独占"
          class="ls-fs-中列"
          :class="{ 'ls-fs-中列--通栏': 一级 !== '游戏' }"
          :style="抽屉样式"
        >
          <div
            v-if="!宽屏"
            class="ls-fs-抽屉把手"
            @pointerdown="开始拖动"
            @pointermove="拖动移动"
            @pointerup="结束拖动"
            @pointercancel="结束拖动"
          >
            <span class="ls-fs-抽屉条"></span>
          </div>

          <GamePanel v-if="一级 === '游戏'" />
          <VariableManager v-else-if="一级 === '变量管理'" />
          <SettingsPage v-else />
        </section>

        <section
          v-if="一级 === '游戏' || !宽屏"
          class="ls-fs-右列"
          :class="{ 'ls-fs-右列--通栏': 正文独占 }"
        >
          <OpeningPanel v-if="视图 === '开局'" class="ls-fs-正文" />
          <StoryPane v-else class="ls-fs-正文" />
          <!-- 输入框与结算按钮都只在各自的推进模式出现：月推进靠结构化选项，不需要自由输入 -->
          <InputPane v-if="视图 === '分钟推进'" class="ls-fs-输入" />
          <SettleBar v-else-if="视图 === '月推进'" class="ls-fs-结算" />
        </section>
      </div>
    </div>

    <button v-if="!宽屏 && 抽屉开" class="ls-fs-遮罩" type="button" aria-label="关闭面板" @click="关抽屉"></button>
  </div>
</template>

<script setup lang="ts">
import './global.css';

// 组件标签必须以字母开头，中文文件名的组件只能另起英文名再引入
import GamePanel from './components/游戏面板.vue';
import InputPane from './components/输入区.vue';
import OpeningPanel from './components/OpeningPanel.vue';
import PrimaryNav from './components/一级导航.vue';
import SettleBar from './components/结算栏.vue';
import SettingsPage from './components/设置页.vue';
import StoryPane from './components/正文区.vue';
import VariableManager from './components/变量管理.vue';
import { 设置状态 } from './设置';
import { useDataStore } from './store';
import { use全屏 } from './全屏';
import { 视图键 } from './视图';
import type { 视图名 } from './视图';

type 一级名称 = '游戏' | '变量管理' | '设置';

const { 是否全屏: 全屏, 全屏失败, 切换全屏 } = use全屏();

const store = useDataStore();

/* ── 渲染异常：变量校验失败时子组件会抛错，这里捕获异常并给出提示 ── */
const 出错 = ref('');

onErrorCaptured(错误 => {
  出错.value = String((错误 as Error)?.message ?? 错误);
  return false;
});

/**
 * 变量是否可用。
 *
 * 本组件的 computed 也要读 store.data，而 onErrorCaptured 只捕获子组件的错误，
 * 所以变量没就绪时必须在这里先拦住，否则读数、顶栏与三列主区会一起渲染成空白。
 */
const 数据就绪 = computed(() => {
  try {
    return Boolean(store.data);
  } catch {
    return false;
  }
});

const 异常 = computed(() => {
  if (出错.value) {
    return '变量结构与当前卡片不匹配，界面无法渲染';
  }
  return 数据就绪.value ? '' : '本楼层变量尚未就绪，界面无法渲染';
});

const 异常详情 = computed(() => 出错.value);

// 视图的判定条件见 视图.ts
const 视图 = computed<视图名>(() => {
  if (!数据就绪.value) {
    return '开局';
  }
  const 当前 = store.data;
  if (当前.终章.已结算) {
    return '终章';
  }
  if (当前.时间.模式 === '分钟推进') {
    return '分钟推进';
  }
  return 当前.时间.回合 > 0 ? '月推进' : '开局';
});

provide(视图键, 视图);

/* ── 设置：模块级响应式单例，设置页写回后这里立刻跟着变 ── */
const 设置 = 设置状态;

// 阅读区样式交给正文区读取：字号、行高、列宽上限
const 阅读区样式 = computed(() => ({
  '--ls-read-size': `${设置.value.字号}px`,
  '--ls-read-leading': String(设置.value.行高),
  '--ls-read-width': `${设置.value.列宽上限}px`,
}));

/* ── 顶栏读数：终章显示结算，分钟推进显示时刻，其余显示姓名、回合与年龄 ── */
const 补零 = (值: number) => String(值).padStart(2, '0');

const 读数 = computed(() => {
  if (store.data.终章.已结算) {
    return '一生结算';
  }

  const 时间 = store.data.时间;
  if (时间.模式 === '分钟推进') {
    const 日期 = 时间.日 > 0 ? `${时间.月} 月 ${时间.日} 日` : `${时间.月} 月末`;
    const 时刻 = 时间.日 > 0 ? `${补零(时间.时)}:${补零(时间.分)}` : '23:59';
    return `${时间.年} 年 ${日期} ${时刻}`;
  }

  const 年龄 = 时间.年龄月 > 0 ? `${时间.年龄岁} 岁 ${时间.年龄月} 个月` : `${时间.年龄岁} 岁`;
  const 段落 = [`第 ${时间.回合} 回合`, 年龄];
  const 名字 = String(store.data.姓名 ?? '').trim();
  return 名字 ? `${名字} · ${段落.join(' · ')}` : 段落.join(' · ');
});

/* ── 一级导航：宽屏常驻三列，窄屏点页签从底部升起抽屉 ── */
const 一级 = ref<一级名称>('游戏');

// 与 global.css 里 (max-width: 1023px) 的那段互补，改动须同步
const 宽屏 = useMediaQuery('(min-width: 1024px)');

/** 正文区独占整宽：开局时中间列不渲染；终章要让出中间列放结算卡，右侧列才放得下正文区 */
const 正文独占 = computed(() => 一级.value === '游戏' && 视图.value === '开局');

const 抽屉开 = ref(false);

function 点导航() {
  // 正文独占时游戏页没有中间列的内容，抽屉打开只会是一片空白
  if (宽屏.value || 正文独占.value) {
    return;
  }
  抽屉开.value = true;
}

function 关抽屉() {
  抽屉开.value = false;
  // 抽屉收起即离开该页，页签回到「游戏」
  一级.value = '游戏';
}

/* 抽屉下拉关闭：位移超过 80 像素即收起 */
const 拖动中 = ref(false);
const 拖动位移 = ref(0);
let 起点纵坐标 = 0;

const 抽屉样式 = computed(() =>
  拖动中.value ? { transform: `translateY(${拖动位移.value}px)`, transition: 'none' } : undefined,
);

function 开始拖动(事件: PointerEvent) {
  const 把手 = 事件.currentTarget as HTMLElement | null;
  起点纵坐标 = 事件.clientY;
  拖动中.value = true;
  拖动位移.value = 0;
  把手?.setPointerCapture?.(事件.pointerId);
}

function 拖动移动(事件: PointerEvent) {
  if (!拖动中.value) {
    return;
  }
  拖动位移.value = Math.max(0, 事件.clientY - 起点纵坐标);
}

function 结束拖动(事件: PointerEvent) {
  if (!拖动中.value) {
    return;
  }
  const 把手 = 事件.currentTarget as HTMLElement | null;
  把手?.releasePointerCapture?.(事件.pointerId);
  const 该收起 = 拖动位移.value > 80;
  拖动中.value = false;
  拖动位移.value = 0;
  if (该收起) {
    // 下拉关闭与点击遮罩关闭走同一段收尾逻辑
    关抽屉();
  }
}
</script>

<style lang="scss" scoped>
.ls-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  box-sizing: border-box;
}

.ls-panel-头 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 2px;
}

.ls-panel-标题 {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ls-text);
}

/* 纯图标按钮：只有图标，说明文字作为悬停提示；悬停只改底色与颜色，不动位置 */
.ls-panel-全屏 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--ls-r-sm);
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 13px;
  cursor: pointer;
}

/* 铺满失败时的现场说明：只在真机出问题时出现，正常游玩看不到 */
.ls-panel-全屏失败 {
  margin: 0 14px 10px;
  padding: 8px 10px;
  border: 1px solid var(--ls-warn, #b4472f);
  border-radius: var(--ls-r-sm);
  color: var(--ls-warn, #b4472f);
  font-size: 12px;
  line-height: 1.6;
}

@media (hover: hover) {
  .ls-panel-全屏:hover {
    background: var(--ls-surface-hover);
    color: var(--ls-text);
  }
}

.ls-变量异常 {
  margin: 0 auto;
  max-width: 620px;
  padding: 18px 20px;
  border: 1px solid var(--ls-alarm-soft);
  border-radius: var(--ls-r-md);
  background: var(--ls-surface);
  color: var(--ls-text-body);
}

.ls-变量异常-标题 {
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-alarm);
}

.ls-变量异常-说明 {
  margin-top: 6px;
  font-size: 13px;
  color: var(--ls-text-muted);
}

.ls-变量异常-详情 {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: var(--ls-r-xs);
  background: var(--ls-surface-sunken);
  font-family: var(--ls-f-mono);
  font-size: 11.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
