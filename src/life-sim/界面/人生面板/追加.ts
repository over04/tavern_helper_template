/**
 * 往酒馆输入框末尾追加内容。
 *
 * 界面只做这一件事：追加。不记已选、不去重、不撤销、不覆盖——界面不知道玩家在
 * 输入框里改过什么，任何比对都会误判，任何重写都会抹掉玩家的改动。加错了由玩家自己删。
 */

/** 取酒馆那一份文档：界面跑在楼层 iframe 里，输入框在主文档上 */
const 取宿主文档 = (): Document => {
  try {
    const 视图 = window.parent;
    return 视图 && 视图 !== window ? 视图.document : document;
  } catch {
    return document;
  }
};

/** 酒馆主文档里的输入框 */
export const 取输入框 = (): HTMLTextAreaElement | null => {
  try {
    return 取宿主文档().querySelector<HTMLTextAreaElement>('#send_textarea');
  } catch (错误) {
    console.warn('人生面板：访问酒馆输入框失败', 错误);
    return null;
  }
};

/** 把一段内容追加到输入框末尾；玩家手打的文本原样留在前面 */
export const 追加输入框 = (内容: string) => {
  const 框 = 取输入框();
  if (!框) {
    return;
  }
  const 段 = String(内容 || '').trim();
  if (!段) {
    return;
  }
  const 原文 = String(框.value || '');
  框.value = 原文.trim() ? `${原文.replace(/\s+$/, '')}\n${段}` : 段;
  // 让酒馆的输入框界面跟着更新
  框.dispatchEvent(new Event('input', { bubbles: true }));
};

/* ── 转义 ──
   事件名与选项由模型生成，行动原文与心向由玩家自由输入，都可能含引号、尖括号与 &。
   直接拼进 XML 会让判定骰脚本的正则解析错位或提前截断，所以按 XML 规则转义。 */

/** 属性值：转义 & 与双引号，尖括号一并转义以免歧义 */
const 转义属性 = (值: string): string =>
  值.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 元素内容：转义 & 与尖括号。开局背景的拼装同样走这里，
 *  否则玩家文本里的尖括号会破坏标签结构，让整段声明落不进正则 */
export const 转义文本 = (值: string): string =>
  值.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 追加一条事件选项；手写行动写成带正文的形态 */
export const 选选项 = (事件: string, 选项: string, 行动原文 = '', 命运点 = '') => {
  const 名 = String(事件 || '').trim();
  const 选 = String(选项 || '').trim();
  if (!名 || !选) {
    return;
  }
  const 配点 = 命运点 ? ` 命运点="${转义属性(命运点)}"` : '';
  if (选 === '其他') {
    // 行动原文可含换行。折行只作用于写进输入框的这一份：正文里的换行会让卡片 span 跨行，
    // 而 行动组 正则的 [^\n]*</span> 不能跨行，会在 span 中途截断。
    const 行动 = String(行动原文 || '')
      .replace(/\r\n|\r|\n/g, ' ')
      .trim();
    // 手写行动没有原文时整条不附：附上去会开出一条无内容的判定
    if (!行动) {
      return;
    }
    追加输入框(`<选择 事件="${转义属性(名)}" 选项="其他"${配点}>${转义文本(行动)}</选择>`);
    return;
  }
  追加输入框(`<选择 事件="${转义属性(名)}" 选项="${转义属性(选)}"${配点}/>`);
};

/** 追加一条心向 */
export const 增心向 = (方向: string) => {
  const 文本 = String(方向 || '').trim();
  if (!文本) {
    return;
  }
  追加输入框(`<心向>${转义文本(文本)}</心向>`);
};

/** 追加一段开局声明：它本身就是整段 XML */
export const 设开局 = (声明: string) => {
  追加输入框(String(声明 || '').trim());
};

/** 追加一条模式切换；由切换模式的那两个组件调用 */
export const 切模式 = (模式: string) => {
  追加输入框(`<模式切换>${转义文本(String(模式 || '').trim())}</模式切换>`);
};
