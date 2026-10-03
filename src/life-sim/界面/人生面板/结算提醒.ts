/**
 * 结算前的提醒：事件表里还有事件尚未选择选项时，先确认一次。
 *
 * 「以此生开始」经过这一处判断；开局时事件表为空，自然不会提醒。
 * 确认框用酒馆自己的弹窗，内容里带一个「以后不再提醒」勾选，勾上后关掉设置里的开关。
 *
 * 已选了什么以输入框为准：界面不另存一份已选状态。
 */

import { 取输入框 } from './追加';
import { 设置状态, 写设置 } from './设置';

/** 取酒馆那一份文档：界面跑在楼层 iframe 里，弹窗要挂在酒馆主文档上才认得出来 */
const 取宿主文档 = (): Document => {
  try {
    const 视图 = window.parent;
    return 视图 && 视图 !== window ? 视图.document : document;
  } catch {
    return document;
  }
};

/** 还原属性值的转义；&amp; 必须最后还原，否则 &amp;lt; 会被先还原成 &lt; 再还原成 < */
const 反转义 = (值: string): string =>
  值.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

/** 输入框里已经写下的选择所对应的事件名 */
const 已选事件 = (): Set<string> => {
  const 值 = String(取输入框()?.value ?? '');
  return new Set(Array.from(值.matchAll(/<选择\s+事件="([^"]*)"/g), 命中 => 反转义(命中[1])));
};

/** 事件表里尚未选择选项的事件数 */
const 未选条数 = (事件: Record<string, unknown> | undefined): number => {
  const 已选 = 已选事件();
  return Object.keys(事件 ?? {}).filter(名 => !已选.has(名)).length;
};

/**
 * 酒馆在 iframe 里注入的 `SillyTavern` 比 @types 里的声明多一个 `getContext`：
 * 酒馆助手的 predefine.js 把它写成 `{ ...getContext(), getContext }`，而 @types 里只声明了上下文本身的字段。
 */
type 带取上下文 = typeof SillyTavern & { getContext: () => typeof SillyTavern };

/** 弹确认框；玩家点「仍然结算」返回 true */
async function 弹提醒(条数: number): Promise<boolean> {
  const 上下文 = (SillyTavern as 带取上下文).getContext();
  // 弹窗与它里面的元素都要建在酒馆那一份文档里，酒馆才能识别
  const 文档 = 取宿主文档();

  const 内容 = 文档.createElement('div');
  内容.style.cssText = 'display:flex;flex-direction:column;gap:12px';

  const 文字 = 文档.createElement('span');
  文字.textContent = `还有 ${条数} 个事件尚未选择选项。`;
  内容.append(文字);

  const 行 = 文档.createElement('label');
  行.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer';
  const 勾选 = 文档.createElement('input');
  勾选.type = 'checkbox';
  行.append(勾选, 文档.createTextNode('以后不再提醒'));
  内容.append(行);

  const 结果 = await 上下文.callGenericPopup(内容, 上下文.POPUP_TYPE.CONFIRM, '', {
    okButton: '仍然结算',
    cancelButton: '取消',
  });

  if (勾选.checked) {
    写设置({ ...设置状态.value, 结算前提醒: false });
  }

  return 结果 === 上下文.POPUP_RESULT.AFFIRMATIVE;
}

/** 需要提醒时弹确认框；不需要提醒、或玩家确认继续时返回 true */
export async function 结算前确认(事件: Record<string, unknown> | undefined): Promise<boolean> {
  const 条数 = 未选条数(事件);
  if (!条数 || !设置状态.value.结算前提醒) {
    return true;
  }

  return 弹提醒(条数);
}
