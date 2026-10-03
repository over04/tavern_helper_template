/**
 * 与酒馆的输入框、发送按钮交互。
 *
 * 界面运行在楼层 iframe 中，与主文档同源，所以直接操作主文档的这两个元素。
 *
 * 随消息附上的声明由界面自己拼、自己写进输入框：玩家点一下面板按钮就能看见要发出去的内容。
 * 拼装只有这一处实现。
 */

import { 取宿主文档 } from './全屏';

/** 酒馆主文档里的输入框 */
export const 取输入框 = (): HTMLTextAreaElement | null => {
  try {
    return 取宿主文档().querySelector<HTMLTextAreaElement>('#send_textarea');
  } catch (错误) {
    console.warn('人生面板：访问酒馆输入框失败', 错误);
    return null;
  }
};

/** 上一次由界面写进输入框的声明；下一次写入前先把它换掉，避免声明越积越多 */
let 上次写的声明 = '';

/** 把声明写进酒馆输入框；玩家手打的文本原样保留在前面 */
export const 写输入框 = (声明: string) => {
  const 框 = 取输入框();
  if (!框) {
    return;
  }

  let 原文 = String(框.value || '');
  // 先摘掉上一次写的声明，玩家手打的内容留着
  if (上次写的声明 && 原文.includes(上次写的声明)) {
    原文 = 原文.replace(上次写的声明, '').replace(/\s+$/, '');
  }

  const 文本 = String(声明 || '').trim();
  框.value = 文本 ? (原文.trim() ? `${原文}\n${文本}` : 文本) : 原文;
  上次写的声明 = 文本;

  // 让酒馆的输入框界面跟着更新
  框.dispatchEvent(new Event('input', { bubbles: true }));
};

/** 触发酒馆自己的发送按钮 */
export const 触发发送 = () => {
  try {
    取宿主文档().querySelector<HTMLButtonElement>('#send_but')?.click();
  } catch (错误) {
    console.error('人生面板：触发发送失败', 错误);
  }
};

/** 把声明写进输入框并立刻发送：玩家点一下面板按钮就完成一次发送 */
export const 写并发送 = (声明: string) => {
  写输入框(声明);
  触发发送();
};
