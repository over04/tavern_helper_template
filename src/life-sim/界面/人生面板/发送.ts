/**
 * 与酒馆的输入框、发送按钮交互。
 *
 * 界面运行在楼层 iframe 中，与主文档同源，所以直接操作主文档的这两个元素。
 * 界面自己不改写输入框内容：真正随消息发出的声明由 脚本/发送拦截.txt 在发送按钮的
 * 捕获阶段拼上，这里只负责把发送这一步触发出去。
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

/** 触发酒馆自己的发送按钮；发送拦截脚本会在这之前把声明拼进输入框 */
export const 触发发送 = () => {
  try {
    取宿主文档().querySelector<HTMLButtonElement>('#send_but')?.click();
  } catch (错误) {
    console.error('人生面板：触发发送失败', 错误);
  }
};
