/**
 * 生成状态：模型正在生成时置真，供全屏壳里的生成浮层显示进度与停止。
 *
 * 生成事件挂在酒馆唯一的全局 eventSource 上，跨楼层、不按 iframe 区分，
 * 所以这里维护的是「整场聊天是否正在生成」，而不是「本楼层是否正在生成」。
 *
 * 结束判定必须同时监听 GENERATION_ENDED 与 GENERATION_STOPPED：
 * 酒馆在正常结束与被停止时都会发出 GENERATION_ENDED，只看它会把中断当成正常结束。
 */

import { onMounted, onUnmounted, ref } from 'vue';
import { 取宿主文档 } from './全屏';

/** 是否正在生成 */
export const 生成中 = ref(false);

/** 已生成的字数：流式事件给的是本次生成的累计全文，取长度即可 */
export const 已生成字数 = ref(0);

const 监听表: Array<() => void> = [];

const 监听 = (事件: EventType, 处理: (...参数: any[]) => void) => {
  监听表.push(eventOn(事件, 处理).stop);
};

const 开始生成 = () => {
  生成中.value = true;
  已生成字数.value = 0;
};

const 结束生成 = () => {
  生成中.value = false;
  已生成字数.value = 0;
};

/** 停止生成：停住酒馆自身的生成，已经流式写进楼层的内容保留 */
export const 停止生成 = () => {
  SillyTavern.stopGeneration();
  结束生成();
};

/**
 * 酒馆在生成期间会给宿主文档的 body 挂 data-generating。
 * 用它给初值：如果生成正在进行，浮层要立刻显示，而不是等下一个事件。
 */
const 读当前是否生成 = () => 取宿主文档().body?.dataset.generating === 'true';

/** 接入生成状态监听；在 App 的 setup 里调用 */
export const use生成状态 = () => {
  onMounted(() => {
    生成中.value = 读当前是否生成();

    监听(tavern_events.GENERATION_STARTED, 开始生成);
    监听(tavern_events.MESSAGE_SENT, 开始生成);
    监听(tavern_events.STREAM_TOKEN_RECEIVED, (文本: string) => {
      已生成字数.value = String(文本 ?? '').length;
    });
    监听(tavern_events.GENERATION_ENDED, 结束生成);
    监听(tavern_events.GENERATION_STOPPED, 结束生成);
    监听(tavern_events.MESSAGE_RECEIVED, 结束生成);
  });

  onUnmounted(() => {
    监听表.forEach(停 => 停());
    监听表.length = 0;
  });

  return { 生成中, 已生成字数, 停止生成 };
};
