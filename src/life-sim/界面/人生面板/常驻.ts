/**
 * 常驻 iframe：全屏壳的承载。
 *
 * 全屏不再靠「把承载界面的楼层 iframe 铺满视口」实现。楼层 iframe 会被酒馆助手重建
 * （`CHARACTER_MESSAGE_RENDERED`、`MESSAGE_UPDATED`、`MESSAGE_SWIPED` 都触发），
 * 重建期间界面会短暂退回楼层里的紧凑尺寸，新文档还要重新走一遍初始化才谈得上恢复。
 * 改成由界面在酒馆主文档里自建一个常驻 iframe、把全屏壳交给它渲染之后，
 * 常驻 iframe 是酒馆主文档的子元素，楼层 iframe 重建与它无关。
 *
 * 实施要满足三个条件（依据见 `handoff/探索/常驻全屏可行性.md`）：
 *
 * 一、不能用 `src` 直指 CDN 产物。jsdelivr 对 `.html` 返回 `text/plain` 并带 `nosniff`，
 * 浏览器不把它当文档解析，脚本一行都不执行；跨域之下常驻实例也读不到宿主状态。
 * 所以用 `srcdoc` 承载。
 *
 * 二、必须自行补齐楼层 iframe 头部那套依赖（jQuery、Vue、lodash、TavernHelper、Mvu 等），
 * 否则产物第一行就报 `Vue is not defined`。依赖从当前楼层 iframe 的 `head` 现取，不做缓存：
 * 预定义注入是以 `blob:` 地址给的，页面刷新后地址会变。
 *
 * 三、产物 `store.ts` 在模块顶层调 `getCurrentMessageId()`，它按 iframe 名字反查楼层号，
 * 而常驻 iframe 的名字不匹配酒馆助手的命名规则，裸名字一启动就抛错。
 * 注入脚本在产物脚本之前把它改成宿主传进来的显式楼层号。
 *
 * 生命周期绑定会话：退出全屏、切聊天、页面卸载三条路都销毁，不留残留节点；
 * 是否已经有一个在跑，靠宿主文档里的元素存在性判断，不依赖跨页面加载的标记。
 */

import { 等到 } from './等待';

/** 承载全屏壳的 iframe 在宿主文档里的标识 */
const 框标识 = 'ls-全屏承载';

/** 宿主窗口上存放事件监听登记的键，见 挂宿主事件 */
const 监听登记键 = '__ls宿主监听';

/**
 * 承载层级。
 *
 * 实测酒馆主文档里的层级：`#chat` 与 `#sheld` 是 30，`#right-nav-panel` 与 `#left-nav-panel`
 * 是 3000，`#top-bar` 是 3005，`#character_popup` 是 4001，`#options` 是 29999。
 * 取 3100 盖住顶栏与两侧面板，全屏就是真的占满整屏；角色弹窗与设置弹窗仍在这之上，
 * 玩家在全屏里打开它们照样能操作。
 */
const 承载层级 = 3100;

/**
 * 承载界面时允许的最长挂载时间；超过就按失败处理。
 *
 * 这段时间要拉一次产物（约 180 KB）与它头部那套依赖，机器负载高或网络慢时几秒都算短。
 * 定得太紧会把「慢」误判成「建不起来」，玩家于是被退回兜底铺满——那条路径在楼层重建时还会丢全屏。
 */
const 挂载时限 = 20000;

/** 界面是否被套在别的界面里：正文区会把楼层正文放进嵌套 iframe，那里也会跑一份产物 */
export const 是否嵌套 = window.parent !== window.top;

/** 承载本界面的 iframe；界面不在 iframe 里时返回 null */
const 取承载元素 = (): HTMLElement | null => {
  const 元素 = window.frameElement as HTMLElement | null;
  return 元素 && 元素.style ? 元素 : null;
};

/** 父文档：界面挂在楼层 iframe 里，宿主文档是承载它的 iframe 所在的文档 */
export const 取父文档 = (): Document | null => {
  const 文档 = 取承载元素()?.ownerDocument ?? null;
  return 文档 && 文档 !== document ? 文档 : null;
};

/**
 * 宿主文档。
 *
 * 取不到父文档时退回上一次取到的那个：楼层 iframe 被酒馆助手移除之后 `window.frameElement`
 * 会变成 null，而此刻切聊天、页面卸载这类事件仍可能回调过来，销毁常驻 iframe 还得靠它。
 * 本窗口没有父文档过、也没缓存过时退回本文档，供本地预览这类宿主与界面同窗口的场合使用。
 */
let 宿主缓存: Document | null = null;

export const 取宿主文档 = (): Document => {
  try {
    const 文档 = 取父文档();
    if (文档) {
      宿主缓存 = 文档;
      return 文档;
    }
  } catch {
    // 承载界面的 iframe 被移除之后，取 frameElement 或它的 ownerDocument 可能抛错，退回缓存
  }
  return 宿主缓存 ?? document;
};

/** 本界面所在的楼层号；取不到时返回 -1，与任何有效楼层都不相等 */
export const 取本楼层号 = (): number => {
  try {
    return getCurrentMessageId();
  } catch {
    return -1;
  }
};

/** 本窗口是否常驻实例，也就是全屏壳的承载文档 */
export const 是否常驻实例 = (): boolean =>
  (window as unknown as { __ls常驻实例?: boolean }).__ls常驻实例 === true;

/** 宿主文档里的常驻 iframe；没有时返回 null */
export const 取常驻框 = (): HTMLIFrameElement | null =>
  (取宿主文档().getElementById(框标识) as HTMLIFrameElement | null) ?? null;

/**
 * 销毁常驻 iframe：退出全屏、切聊天、页面卸载三条路都走这里。
 *
 * 三条路可能同时到达：楼层 iframe 重建后旧文档挂在宿主事件源上的监听器不会随之解绑，
 * 切聊天时新旧两处会各跑一次。所以这里按存在性销毁，重复调用直接返回。
 */
export const 销毁常驻 = () => {
  try {
    const 框 = 取常驻框();
    if (框 && 框.parentNode) {
      框.parentNode.removeChild(框);
    }
  } catch {
    // 框已被另一处销毁，或宿主文档已不可访问：没有需要清理的东西
  }
};

/**
 * 在宿主文档的事件源上挂监听器，返回解绑函数；取不到宿主事件源时返回 null。
 *
 * 不走酒馆助手的 `eventOn`：它按 iframe 名管理监听器，楼层 iframe 被移除时会把该名字下的条目
 * 一并清掉，而切聊天正是先移除楼层 iframe，等事件发出来时监听器已经失效，销毁动作执行不到。
 * 直接挂宿主事件源就不受楼层 iframe 的生死影响。
 */
export const 挂宿主事件 = (事件: string, 处理: () => void): (() => void) | null => {
  type 事件源型 = {
    on?: (名称: string, 回调: () => void) => void;
    removeListener?: (名称: string, 回调: () => void) => void;
  };
  const 视图 = 取宿主文档().defaultView as
    | (Window & { SillyTavern?: { getContext?: () => { eventSource?: 事件源型 } } })
    | null;
  const 事件源 = 视图?.SillyTavern?.getContext?.().eventSource;
  if (typeof 事件源?.on !== 'function' || typeof 事件源.removeListener !== 'function' || !视图) {
    return null;
  }

  // 宿主窗口上的登记表：楼层 iframe 每被重建一次，旧文档挂上来的监听器就多留一个
  // （文档被销毁时 Vue 收不到卸载通知，解绑执行不到）。按事件名只保留最新一个回调，
  // 挂之前先把上一个摘掉，长时间游玩不会累积。
  const 登记 = (视图 as unknown as Record<string, unknown>)[监听登记键];
  const 表: Record<string, () => void> = 登记 && typeof 登记 === 'object'
    ? (登记 as Record<string, () => void>)
    : {};
  (视图 as unknown as Record<string, unknown>)[监听登记键] = 表;

  const 上一个 = 表[事件];
  if (上一个) {
    事件源.removeListener?.(事件, 上一个);
  }

  // 必须连在事件源上调用：酒馆的事件源是自带实现的 EventEmitter，它的方法读的是 this 上的内部表，
  // 把方法取出来单独调用会丢掉 this 并直接抛错
  事件源.on?.(事件, 处理);
  表[事件] = 处理;

  return () => {
    事件源.removeListener?.(事件, 处理);
    if (表[事件] === 处理) {
      delete 表[事件];
    }
  };
};

/** 读一段文本，失败时返回空串 */
const 读文本 = async (地址: string): Promise<string> => {
  try {
    const 响应 = await fetch(地址);
    return 响应.ok ? await 响应.text() : '';
  } catch {
    return '';
  }
};

/** 产物地址：卡片的正则加载器写在楼层 iframe 的 srcdoc 里 */
const 取产物地址 = (): string => {
  const 原文 = (window.frameElement as HTMLIFrameElement | null)?.srcdoc ?? '';
  const 匹配 = 原文.match(/["'](https?:\/\/[^"']+\.html)["']/);
  return 匹配 ? 匹配[1] : '';
};

/**
 * 依赖标签：把楼层 iframe 头部那一套原样搬过来。
 *
 * 跳过两类脚本：酒馆助手的日志脚本，以及高度自适应脚本——后者会持续把常驻 iframe 的高度
 * 写成界面文档的 `body.scrollHeight`，全屏壳会跟着塌回内容高度。
 * 这两类都认不出地址（以 `blob:` 给出），所以 blob 脚本要取回源码按内容判断，判断完就地内联。
 */
const 取依赖标签 = async (): Promise<string[]> => {
  const 片段: string[] = [];

  for (const 元素 of Array.from(document.head.children)) {
    if (元素.tagName === 'LINK' || 元素.tagName === 'STYLE') {
      片段.push(元素.outerHTML);
      continue;
    }
    if (元素.tagName !== 'SCRIPT') {
      continue;
    }

    const 地址 = (元素 as HTMLScriptElement).src;
    if (!地址) {
      // 内联脚本：楼层 iframe 的 head 里没有，产物自己那份在 body 里，随产物一起搬
      continue;
    }
    if (/\/log\.js(\?|$)/.test(地址)) {
      continue;
    }
    if (!地址.startsWith('blob:')) {
      片段.push(元素.outerHTML);
      continue;
    }

    const 源码 = await 读文本(地址);
    if (!源码) {
      continue;
    }
    if (/frameElement\.style\.height/.test(源码)) {
      continue;
    }
    片段.push(`<script>${源码}</script>`);
  }

  return 片段;
};

/**
 * 注入脚本：在产物脚本之前定义常驻实例的身份与楼层号。
 *
 * 结束标签写成 `<\/script>` 这种带转义的形式：这段文本会随产物一起进 HTML 文档，
 * 写成不转义的形式会让浏览器在字符串中间就把脚本判为结束。构建工具的压缩器默认也会做这层转义，
 * 但这里自己写清楚，不依赖工具配置。
 */
const 拼注入 = (楼层号: number) =>
  [
    '<script>',
    'window.__ls常驻实例 = true;',
    `window.__ls楼层号 = ${楼层号};`,
    'window.getCurrentMessageId = function () { return window.__ls楼层号; };',
    '<\/script>',
  ].join('\n');

/**
 * 拼承载文档。
 *
 * 产物是单文件，头部是内联脚本与样式、body 里只有界面根容器，这里按 head 与 body 拆开，
 * 把依赖与注入插在产物脚本之前。普通脚本同步执行，产物的模块脚本延迟到解析完成后执行，
 * 所以注入一定先于产物生效。
 *
 * 只写文档类型声明与内容，不写 html、head、body 这层骨架标签：解析器会自行分派，
 * 缺标签照样得到一份完整文档；而一旦这些标签的字面量进了产物的脚本，
 * 任何按标签切分产物的解析（预览脚本就是）都会在代码中间切错位置。
 * 文档类型声明不能省：srcdoc 没有它时 iframe 会按怪异模式渲染，盒模型与布局都跟着变。
 */
const 拼承载文档 = (依赖: string[], 楼层号: number, 产物: string): string => {
  const 解析 = new DOMParser().parseFromString(产物, 'text/html');
  return [
    '<!DOCTYPE html>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    ...依赖,
    拼注入(楼层号),
    解析.head.innerHTML,
    解析.body.innerHTML,
  ].join('\n');
};

/** 承载文档里的界面是否已经挂出来；进入异常态也算，那种情况界面自己会把原因写在根容器里 */
const 已挂出 = (框: HTMLIFrameElement): boolean => {
  try {
    const 内页 = 框.contentDocument;
    return Boolean(内页?.querySelector('.ls-fs, .ls-panel, .ls-变量异常'));
  } catch {
    return false;
  }
};

/** 建框过程是否正在进行，避免连点两下建出两个承载 */
let 正在建 = false;

export const 建常驻进行中 = (): boolean => 正在建;

/**
 * 建立常驻 iframe。
 *
 * @param 楼层号 界面所在的楼层号，由调用方从楼层实例里取好传进来
 * @returns 空串表示成功；非空串是失败原因，由调用方决定是否退回铺满本楼层界面
 */
export const 建常驻 = async (楼层号: number): Promise<string> => {
  if (正在建) {
    return '全屏承载正在建立中';
  }

  const 宿主 = 取宿主文档();
  if (宿主 === document) {
    // 界面不在别的文档里（本地预览）：没有可用的宿主文档，也取不到楼层 iframe 的依赖
    return '界面不在酒馆页面里，无法自建全屏承载';
  }
  if (取常驻框()) {
    return '';
  }

  const 地址 = 取产物地址();
  if (!地址) {
    return '找不到界面产物的地址：楼层 iframe 里没有加载器';
  }

  正在建 = true;
  try {
    const 产物 = await 读文本(地址);
    if (!产物) {
      return `取不到界面产物：${地址}`;
    }

    const 依赖 = await 取依赖标签();
    const 框 = 宿主.createElement('iframe');
    框.id = 框标识;
    // 名称与标识一致：酒馆助手的预定义注入会把 iframe 的 id 或 name 记成界面身份
    框.setAttribute('name', 框标识);
    框.setAttribute('title', '人生面板全屏承载');
    框.style.setProperty('position', 'fixed');
    框.style.setProperty('top', '0');
    框.style.setProperty('left', '0');
    框.style.setProperty('width', '100%');
    // 高度必须用视口单位：实测酒馆主文档的 html 计算高度是 0，而 html 上有单位矩阵的 transform，
    // 它会成为 position: fixed 的包含块，写 100% 会被解析成 0，框整个看不见
    框.style.setProperty('height', '100vh');
    框.style.setProperty('height', '100dvh');
    框.style.setProperty('border', '0');
    框.style.setProperty('margin', '0');
    框.style.setProperty('z-index', String(承载层级));
    框.style.setProperty('background', '#faf9f5');

    宿主.body.append(框);
    框.srcdoc = 拼承载文档(依赖, 楼层号, 产物);

    const 挂出 = await 等到(() => 已挂出(框), 挂载时限);
    if (!挂出) {
      框.remove();
      return '全屏承载没能加载出来：产物脚本没有在承载 iframe 里执行，多为 CDN 不通';
    }
    return '';
  } finally {
    正在建 = false;
  }
};
