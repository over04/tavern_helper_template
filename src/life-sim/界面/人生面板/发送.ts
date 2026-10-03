/**
 * 与酒馆的输入框交互。
 *
 * 界面运行在楼层 iframe 中，与主文档同源，所以直接操作主文档的输入框元素。
 *
 * 界面只会往输入框末尾追加内容。不比对、不删除、不覆盖：界面不知道玩家在输入框里
 * 改过什么，任何比对都会误判，任何重写都会抹掉玩家的改动。加错了由玩家自己删。
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

/**
 * 把一段内容追加到输入框末尾；玩家手打的文本原样留在前面。
 *
 * 发送由玩家自己按下，界面不碰发送键。
 */
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
