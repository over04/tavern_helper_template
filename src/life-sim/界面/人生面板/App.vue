<template>
  <!-- 变量没就绪或渲染出错时给出明确的提示，避免整块界面渲染成空白 -->
  <div v-if="异常" class="ls-变量异常">
    <p class="ls-变量异常-标题">{{ 异常 }}</p>
    <p class="ls-变量异常-说明">若这是导入新卡片之前的旧聊天，请新建聊天后重试。</p>
    <pre v-if="异常详情" class="ls-变量异常-详情">{{ 异常详情 }}</pre>
  </div>

  <!-- 聊天层：面板就是聊天里的一块。正文由酒馆自己渲染，这里只放状态与操作 -->
  <div v-else class="ls-panel" :class="{ 'ls-fs--动效': 设置.动效 }">
    <div class="ls-panel-头">
      <span class="ls-panel-标题">模拟人生</span>
      <span class="ls-panel-读数">{{ 读数 }}</span>
    </div>
    <PrimaryNav v-model="一级" :纵向="false" />
    <GamePanel v-if="一级 === '游戏'" />
    <VariableManager v-else-if="一级 === '变量管理'" />
    <SettingsPage v-else />
  </div>
</template>

<script setup lang="ts">
import './global.css';

// 组件标签必须以字母开头，中文文件名的组件只能另起英文名再引入
import GamePanel from './components/游戏面板.vue';
import GenerationOverlay from './components/生成浮层.vue';
import InputPane from './components/输入区.vue';
import OpeningPanel from './components/OpeningPanel.vue';
import PrimaryNav from './components/一级导航.vue';
import SettingsPage from './components/设置页.vue';
import VariableManager from './components/变量管理.vue';
import { 设置状态 } from './设置';
import { useDataStore } from './store';
import { 声明仍在输入框 } from './发送';
import { use待发送 } from './待发送';
import { 视图键 } from './视图';
import type { 视图名 } from './视图';

type 一级名称 = '游戏' | '变量管理' | '设置';

// 酒馆发出消息之前会清空输入框。界面写的声明若已不在输入框里，说明它随这条消息发出去了，
// 此刻才清空待发送；斜杠命令与快速回复不走输入框，声明仍在，玩家的选择不该被清掉
const 待发送 = use待发送();
const 停发送监听 = eventOn(tavern_events.MESSAGE_SENT, () => {
  if (!声明仍在输入框()) {
    待发送.发送后清空();
  }
});
onUnmounted(() => 停发送监听.stop());

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

/* ── 面板读数：终章显示结算，分钟推进显示时刻，其余显示姓名、回合与年龄 ── */
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

/* ── 一级导航：三个页签直接切页面 ── */
const 一级 = ref<一级名称>('游戏');
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

.ls-panel-读数 {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: right;
  color: var(--ls-text-muted);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
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
