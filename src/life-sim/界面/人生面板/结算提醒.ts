/**
 * 结算前的提醒：事件表里还有事件尚未选择选项时，先确认一次。
 *
 * 「以此生开始」经过这一处判断；开局时事件表为空，自然不会提醒。
 * 确认框用酒馆自己的弹窗，内容里带一个「以后不再提醒」勾选，勾上后关掉设置里的开关。
 */

import { 设置状态, 写设置 } from './设置';
import { use待发送 } from './待发送';
import type { 待发送选择 } from './待发送';

/** 取酒馆那一份文档：界面跑在楼层 iframe 里，弹窗要挂在酒馆主文档上才认得出来 */
const 取宿主文档 = (): Document => {
  try {
    const 视图 = window.parent;
    return 视图 && 视图 !== window ? 视图.document : document;
  } catch {
    return document;
  }
};

/** 事件表里尚未选择选项的事件数 */
const 未选条数 = (事件: Record<string, unknown> | undefined, 选择: 待发送选择[]): number =>
  Object.keys(事件 ?? {}).filter(名 => !选择.some(项 => 项.事件 === 名)).length;

/** 弹确认框；玩家点「仍然结算」返回 true */
async function 弹提醒(条数: number): Promise<boolean> {
  const 上下文 = SillyTavern.getContext();
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
  const 待发送 = use待发送();
  待发送.刷新();

  const 条数 = 未选条数(事件, 待发送.状态.value.选择);
  if (!条数 || !设置状态.value.结算前提醒) {
    return true;
  }

  return 弹提醒(条数);
}
