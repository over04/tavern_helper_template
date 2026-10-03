/**
 * 与酒馆的输入框、发送按钮交互。
 *
 * 界面运行在楼层 iframe 中，与主文档同源，所以直接操作主文档的这两个元素。
 *
 * 随消息附上的声明由界面自己拼、自己写进输入框：玩家点一下面板按钮就能看见要发出去的内容。
 * 拼装只有这一处实现。
 */

/** 取酒馆那一份文档：界面跑在楼层 iframe 里，输入框与发送键都在主文档上 */
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

/* ── 上一次写入的声明 ──
   记在宿主 window 上，不记在模块变量里：承载界面的 iframe 一旦被酒馆助手重渲染，
   本文档整体重载、模块状态清零，而输入框在主文档里、里面的声明还在。
   记在模块变量里会让下一次写入认不出旧声明，两条声明叠在输入框里。 */

const 上次写的键 = '__ls上次写的声明';

/** 取酒馆那一份 window：记录箱要挂在宿主上，楼层 iframe 重载时模块状态会清零 */
const 取宿主窗口 = (): Window => {
  try {
    const 视图 = window.parent;
    return 视图 && 视图 !== window ? 视图 : window;
  } catch {
    return window;
  }
};

const 记录箱 = (): Record<string, unknown> => 取宿主窗口() as unknown as Record<string, unknown>;

const 读上次写的 = (): string => String(记录箱()[上次写的键] ?? '');

const 写上次写的 = (值: string) => {
  if (值) {
    记录箱()[上次写的键] = 值;
  } else {
    delete 记录箱()[上次写的键];
  }
};

/**
 * 界面写进输入框的那份声明此刻是否还在输入框里。
 *
 * 酒馆发出消息之前会清空输入框，所以「声明已不在输入框里」等价于「它随这条消息发出去了」。
 * 斜杠命令与快速回复不走输入框，声明仍在，据此可以把它们与真正的发送区分开。
 */
export const 声明仍在输入框 = (): boolean => {
  const 声明 = 读上次写的();
  return Boolean(声明) && String(取输入框()?.value ?? '').includes(声明);
};

/**
 * 把声明写进酒馆输入框；玩家手打的文本原样保留在前面。
 *
 * 摘除上一次写入的声明时只认「输入框末尾那一段」：声明一律附在玩家文本之后，
 * 只认末尾才不会在玩家恰好手打了同样一段文字时误删玩家自己的内容。
 */
export const 写输入框 = (声明: string) => {
  const 框 = 取输入框();
  if (!框) {
    return;
  }

  const 上次 = 读上次写的();
  let 原文 = String(框.value || '');
  if (上次 && 原文.endsWith(上次)) {
    原文 = 原文.slice(0, -上次.length).replace(/\s+$/, '');
  }

  const 文本 = String(声明 || '').trim();
  框.value = 文本 ? (原文.trim() ? `${原文}\n${文本}` : 文本) : 原文;
  写上次写的(文本);

  // 让酒馆的输入框界面跟着更新
  框.dispatchEvent(new Event('input', { bubbles: true }));
};
