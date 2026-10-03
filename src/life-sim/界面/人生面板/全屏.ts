/**
 * 全屏：把全屏壳交给一个常驻 iframe 渲染。
 *
 * 界面平时位于聊天楼层里，点「全屏」由本模块在酒馆主文档里建一个常驻 iframe，
 * 里面跑同一份产物、渲染全屏壳；点「退出全屏」销毁它，玩家回到楼层里的紧凑面板。
 * 承载方式与三个实施条件见 `常驻.ts` 的文件头。
 *
 * 全屏态不跨页面加载保留：会话打开一律是楼层里的紧凑面板，玩家点全屏才进全屏，
 * 重开会话回到紧凑面板。所以这里没有任何按宿主标记自动铺满的逻辑，
 * 是否全屏只看本实例是不是常驻实例（见 `是否全屏` 的说明）。
 *
 * 常驻承载建不起来时（取不到产物、CDN 不通）退回把承载界面的 iframe 铺满视口，
 * 这条兜底路径要沿祖先链清除会让元素成为 `position: fixed` 包含块的属性，并锁住宿主文档的滚动，
 * 退出时按快照写回。理由与清单一并写在下面各段。
 *
 * 不用浏览器的全屏 API：iOS 把全屏内容当作一次性展示，下滑是退出而不是滚动，
 * 还会常驻一条「Swipe down to exit」的系统横幅，网页侧没有 API 可以屏蔽。
 */

import { onMounted, onUnmounted, ref } from 'vue';
import { 挂宿主事件, 建常驻, 取宿主文档, 是否常驻实例, 是否嵌套, 销毁常驻, 取本楼层号 } from './常驻';

/** 承载方式相关的接口都实现在 `常驻.ts`，这里照旧导出，调用方不必知道文件怎么分 */
export { 取父文档, 取宿主文档, 是否嵌套 } from './常驻';

/** 会让该元素成为 position: fixed 包含块的属性，以及它在不构成包含块时的取值
 *  - `translate`、`rotate`、`scale` 是独立变换属性，与 `transform` 等价地构成包含块
 *  - `content-visibility` 取 `auto` 时带来 layout containment；它的干净值是 `visible`，
 *    写 `none` 是非法值会被引擎忽略，属性清除不掉
 *  - `view-transition-name` 非 `none` 时同样构成包含块 */
const 包含块属性: Array<[属性: string, 干净值: string]> = [
  ['transform', 'none'],
  ['-webkit-transform', 'none'],
  ['translate', 'none'],
  ['rotate', 'none'],
  ['scale', 'none'],
  ['perspective', 'none'],
  ['-webkit-perspective', 'none'],
  ['filter', 'none'],
  ['-webkit-filter', 'none'],
  ['backdrop-filter', 'none'],
  ['-webkit-backdrop-filter', 'none'],
  ['will-change', 'auto'],
  ['contain', 'none'],
  ['content-visibility', 'visible'],
  ['view-transition-name', 'none'],
];

/** 承载本界面的 iframe；界面不在 iframe 里时返回 null */
const 取承载元素 = (): HTMLElement | null => {
  const 元素 = window.frameElement as HTMLElement | null;
  return 元素 && 元素.style ? 元素 : null;
};

/**
 * 是否处于全屏。
 *
 * 常驻实例从启动起就是全屏壳，楼层实例始终渲染楼层里的紧凑面板——全屏期间它被常驻 iframe
 * 整个盖住，玩家看不到，也就不必跟着切形态。这样退出全屏时紧凑面板本来就在，
 * 不需要任何跨 iframe 的状态同步。
 * 兜底路径（铺满承载界面的 iframe）下由楼层实例渲染全屏壳，那时这里才变成真。
 */
export const 是否全屏 = ref(是否常驻实例());

/* 常驻实例一启动就是全屏壳，类要在这里就挂上：global.css 按它把界面文档的高度链
   撑成宿主视口高，全屏壳才有满高可用。放在组件挂载里会先渲染一帧紧凑高度。 */
if (是否常驻实例()) {
  document.documentElement.classList.add('ls-全屏');
}

/* ── 快照 ──
   兜底路径改过的样式与属性要按原样写回，快照必须活到退出全屏那一刻。
   放在模块级变量里不行：承载界面的 iframe 一旦被重渲染，本文档整体重载，
   模块状态清零、还原() 永远不会执行，宿主的 overflow、被清除为 auto 的 z-index、
   补上的 viewport-fit 就永久留在酒馆页面上（界面既看不见也退不出）。
   所以快照写进宿主 window：宿主文档不随楼层 iframe 重载而变，新文档挂载时能把它回收。 */

type 样式快照 = { 元素: HTMLElement; cssText: string };
type 属性快照 = { 元素: HTMLElement; 属性名: string; 原值: string | null };
type 全屏快照 = { 样式: 样式快照[]; 属性: 属性快照[] };

/** 快照键：同一时刻只有一个界面处于铺满态，用单键即可 */
const 快照键 = '__ls全屏快照';

/** 存放快照的对象；取不到宿主 window 时退回本窗口 */
const 快照箱 = (): Record<string, unknown> => {
  const 宿主 = 取宿主文档().defaultView;
  return (宿主 ?? window) as unknown as Record<string, unknown>;
};

/** 当前这次全屏的快照，没有就新建一份 */
const 当前快照 = (): 全屏快照 => {
  const 箱 = 快照箱();
  const 已有 = 箱[快照键] as 全屏快照 | undefined;
  if (已有 && Array.isArray(已有.样式) && Array.isArray(已有.属性)) {
    return 已有;
  }
  const 新份: 全屏快照 = { 样式: [], 属性: [] };
  箱[快照键] = 新份;
  return 新份;
};

/** 读快照，格式不对就当作没有 */
const 取快照 = (): 全屏快照 | null => {
  const 数据 = 快照箱()[快照键] as 全屏快照 | undefined;
  return 数据 && Array.isArray(数据.样式) && Array.isArray(数据.属性) ? 数据 : null;
};

const 清快照 = () => {
  delete 快照箱()[快照键];
};

/** 把快照写回：元素已经不在文档里就跳过（旧承载 iframe 被重渲染时会被移除） */
const 写回快照 = (快照: 全屏快照) => {
  for (const { 元素, cssText } of 快照.样式) {
    if (元素.isConnected) {
      元素.style.cssText = cssText;
    }
  }
  for (const { 元素, 属性名, 原值 } of 快照.属性) {
    if (!元素.isConnected) {
      continue;
    }
    if (原值 === null) {
      元素.removeAttribute(属性名);
    } else {
      元素.setAttribute(属性名, 原值);
    }
  }
};

const 还原 = () => {
  const 快照 = 取快照();
  if (快照) {
    写回快照(快照);
  }
  清快照();
};

/** 同一个元素只留第一次的快照：祖先链一轮与宿主滚动一轮会碰到同一批元素 */
const 记下 = (元素: HTMLElement) => {
  const 快照 = 当前快照();
  if (快照.样式.some(记录 => 记录.元素 === 元素)) {
    return;
  }
  快照.样式.push({ 元素, cssText: 元素.style.cssText });
};

/** 记下元素某个属性的原值：同一个元素的同一个属性只留第一次的快照 */
const 记下属性 = (元素: HTMLElement, 属性名: string) => {
  const 快照 = 当前快照();
  if (快照.属性.some(记录 => 记录.元素 === 元素 && 记录.属性名 === 属性名)) {
    return;
  }
  快照.属性.push({ 元素, 属性名, 原值: 元素.getAttribute(属性名) });
};

/** 读宿主文档的真实安全区：在宿主文档里挂一个探针元素，读它的计算值 */
const 读安全区 = (): { 顶: number; 底: number } => {
  const 文档 = 取宿主文档();
  const 视图 = 文档.defaultView;
  if (!文档.body || !视图) {
    return { 顶: 0, 底: 0 };
  }

  const 探针 = 文档.createElement('div');
  探针.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-bottom)';
  文档.body.append(探针);

  const 计算 = 视图.getComputedStyle(探针);
  const 顶 = Number.parseFloat(计算.paddingTop) || 0;
  const 底 = Number.parseFloat(计算.paddingBottom) || 0;
  探针.remove();

  return { 顶, 底 };
};

/**
 * 读酒馆顶栏占掉的高度。
 *
 * 常驻承载的层级低于酒馆顶栏，顶栏会盖在界面壳之上，所以壳的顶部要让出它的高度。
 * 顶栏从视口顶部算起，它的下沿就是让位高度；顶栏隐藏时退回 0。
 */
const 读顶栏占位 = (): number => {
  const 顶栏 = 取宿主文档().getElementById('top-bar');
  if (!顶栏) {
    return 0;
  }
  const 盒 = 顶栏.getBoundingClientRect();
  return 盒.height > 0 ? Math.max(0, 盒.bottom) : 0;
};

/** 把安全区与顶栏占位写回界面根容器：界面壳的顶栏与底部导航都从它取值 */
const 应用安全区 = () => {
  const 根 = document.getElementById('ls-app');
  if (!根) {
    return;
  }
  const { 顶, 底 } = 读安全区();
  根.style.setProperty('--ls-safe-top', `${Math.max(顶, 读顶栏占位())}px`);
  根.style.setProperty('--ls-safe-bottom', `${底}px`);
};

const 清安全区 = () => {
  const 根 = document.getElementById('ls-app');
  根?.style.removeProperty('--ls-safe-top');
  根?.style.removeProperty('--ls-safe-bottom');
};

/** 上一次全屏失败的原因，空串表示没有失败；界面把它显示出来，实际设备上出问题时有据可查 */
export const 全屏失败 = ref('');

/** 元素的简写，写诊断信息用 */
const 描述 = (元素: HTMLElement) => {
  const 标识 = 元素.id ? `#${元素.id}` : '';
  const 类 = typeof 元素.className === 'string' && 元素.className.trim() ? `.${元素.className.trim().split(/\s+/)[0]}` : '';
  return `${元素.tagName.toLowerCase()}${标识}${类}`;
};

/** 沿祖先链往上走一层，穿过 shadow 边界：parentElement 在 shadow 根处返回 null，链会在此中断 */
const 上一层 = (节点: Node): HTMLElement | null => {
  if (节点.parentElement) {
    return 节点.parentElement;
  }
  const 根 = 节点.getRootNode();
  return 根 instanceof ShadowRoot ? (根.host as HTMLElement) : null;
};

/** 承载元素所在文档的视口尺寸：手机浏览器上视觉视口可能比布局视口高，取两者较大的那个 */
const 读视口 = (承载: HTMLElement) => {
  const 视图 = 承载.ownerDocument.defaultView;
  return {
    宽: 视图?.innerWidth ?? 0,
    高: Math.max(视图?.innerHeight ?? 0, 视图?.visualViewport?.height ?? 0),
  };
};

/* ── 现场快照 ──
   自检失败时这几行字就是实际设备上的唯一线索，所以必须记在清理之前。 */

type 现场项 = { 描述: string; 定位: string; 异常: string[] };

/** 沿祖先链记下每个元素上仍取到非干净值的包含块属性 */
const 记祖先现场 = (起点: HTMLElement): 现场项[] => {
  const 视图 = 起点.ownerDocument.defaultView;
  if (!视图) {
    return [];
  }

  const 现场: 现场项[] = [];
  for (let 元素: HTMLElement | null = 起点; 元素; 元素 = 上一层(元素)) {
    const 计算 = 视图.getComputedStyle(元素);
    const 异常: string[] = [];
    for (const [属性, 干净值] of 包含块属性) {
      const 值 = 计算.getPropertyValue(属性).trim();
      if (值 && 值 !== 干净值) {
        异常.push(`${属性}=${值}`);
      }
    }
    现场.push({
      描述: 描述(元素),
      定位: 计算.getPropertyValue('position').trim() || 'static',
      异常,
    });
  }
  return 现场;
};

/** 把现场整理成一行可读完的文字：只报前几个仍在构成包含块的祖先 */
const 现场摘要 = (现场: 现场项[]) => {
  const 有问题的 = 现场.filter(项 => 项.异常.length > 0);
  if (有问题的.length === 0) {
    return '祖先链上没有任何属性仍在构成包含块';
  }
  return 有问题的
    .slice(0, 3)
    .map(项 => `${项.描述}（${项.定位}）的 ${项.异常.slice(0, 4).join('、')}`)
    .join('；');
};

/** 宿主文档的滚动与视觉视口：手机键盘弹起、地址栏伸缩都会动这两个值，是位置偏移的常见来源 */
const 读视口现场 = (承载: HTMLElement) => {
  const 视图 = 承载.ownerDocument.defaultView;
  const 视觉 = 视图?.visualViewport;
  return {
    滚动: `${Math.round(视图?.scrollX ?? 0)}、${Math.round(视图?.scrollY ?? 0)}`,
    视觉: 视觉
      ? `${Math.round(视觉.offsetLeft)}、${Math.round(视觉.offsetTop)}，` +
        `${Math.round(视觉.width)}×${Math.round(视觉.height)}，缩放 ${视觉.scale.toFixed(2)}`
      : '不可用',
  };
};

/** 把一个元素及其祖先链上构成层叠上下文的部分清除为 auto，并记进快照
 *  只清除 z-index 与 isolation：flex/grid 子项上的 z-index 同样构成层叠上下文，而它的 position 是 static，
 *  只看 position 会漏掉酒馆的 #chat（display:flex 的子项、position:static、z-index:30）。 */
const 清层叠 = (起点: HTMLElement | null) => {
  for (let 元素: HTMLElement | null = 起点; 元素; 元素 = 上一层(元素)) {
    const 样式 = 元素.ownerDocument.defaultView?.getComputedStyle(元素);
    if (!样式 || (样式.isolation !== 'isolate' && 样式.zIndex === 'auto')) {
      continue;
    }
    记下(元素);
    元素.style.setProperty('z-index', 'auto', 'important');
    元素.style.setProperty('isolation', 'auto', 'important');
  }
};

const 铺满 = (): boolean => {
  const 承载 = 取承载元素();
  if (!承载) {
    全屏失败.value = '没找到承载界面的 iframe（window.frameElement 为空），无法铺满';
    return false;
  }

  // 现场必须在清理之前记录：清理之后再扫，扫到的全是自己刚清除干净的属性
  const 现场 = 记祖先现场(承载);

  记下(承载);
  承载.style.setProperty('position', 'fixed', 'important');
  for (const 边 of ['top', 'right', 'bottom', 'left']) {
    承载.style.setProperty(边, '0', 'important');
  }
  // iframe 是替换元素：width/height 为 auto 时取的是它自己的固有尺寸，不是包含块，
  // 默认书写方向下，right/bottom 还会被当成过度约束而忽略。要铺满必须写成百分比。
  承载.style.setProperty('width', '100%', 'important');
  承载.style.setProperty('height', '100%', 'important');
  // 手机浏览器的地址栏伸缩时，position: fixed 跟的是布局视口，视觉视口更高，底下会露出酒馆原生界面。
  // dvh 跟的是动态视口，写在 100% 之后作覆盖；不支持 dvh 的浏览器会忽略这一条，退回上一行。
  承载.style.setProperty('height', '100dvh', 'important');
  承载.style.setProperty('max-width', 'none', 'important');
  承载.style.setProperty('max-height', 'none', 'important');
  承载.style.setProperty('margin', '0', 'important');
  承载.style.setProperty('border', '0', 'important');
  承载.style.setProperty('border-radius', '0', 'important');
  承载.style.setProperty('z-index', '2147483000', 'important');
  承载.style.setProperty('background', 'var(--ls-bg)', 'important');

  // 沿祖先链清除包含块属性，承载元素本身也在内
  for (let 元素: HTMLElement | null = 承载; 元素; 元素 = 上一层(元素)) {
    if (元素 !== 承载) {
      记下(元素);
    }
    for (const [属性, 干净值] of 包含块属性) {
      元素.style.setProperty(属性, 干净值, 'important');
    }
  }

  // 祖先里凡是构成层叠上下文的，会把承载元素的 z-index 限制在该上下文内部：2147483000 只在那层上下文内部有效，
  // 对上下文之外（酒馆的顶栏与底部输入区）只相当于该上下文自身的层级，于是尺寸铺满了却还被压住。
  // 把这类祖先的 z-index 与 isolation 也清除为 auto，承载元素就能在根层叠上下文里直接与它们比较层级高低。
  // 快照由 记下 在第一次调用时取，此处两个属性都在快照之后才改，还原时一并写回。
  清层叠(上一层(承载));

  // 锁住宿主文档的滚动，避免界面下方的内容跟着滚动
  const 文档 = 取宿主文档();
  for (const 元素 of [文档.documentElement, 文档.body]) {
    if (!元素) {
      continue;
    }
    记下(元素);
    元素.style.setProperty('overflow', 'hidden', 'important');
  }

  // iOS 的 env(safe-area-inset-*) 只认顶层文档的 viewport 声明，iframe 自己的 meta 在 iOS 上不生效；
  // 酒馆的 meta 又没有 viewport-fit=cover，于是顶栏与底部导航读到的安全区恒为 0，刘海与 Home 条会压住内容。
  // 全屏时给宿主文档补上，退出时按属性快照还原：这里改的是 content 属性，不是元素的 style。
  const 视口声明 = 文档.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (视口声明 && !/viewport-fit/.test(视口声明.content)) {
    记下属性(视口声明, 'content');
    视口声明.content = `${视口声明.content}, viewport-fit=cover`;
  }

  // 读回实际矩形做自检：实际设备上偶尔有祖先仍在构成包含块、或样式被其他规则覆盖，铺满会失败且不留任何提示
  const { 宽: 视口宽, 高: 视口高 } = 读视口(承载);
  const 盖住了 = () => {
    if (!视口宽 || !视口高) {
      return true;
    }
    const 盒 = 承载.getBoundingClientRect();
    return (
      Math.abs(盒.width - 视口宽) < 2 &&
      Math.abs(盒.height - 视口高) < 2 &&
      Math.abs(盒.top) < 2 &&
      Math.abs(盒.left) < 2
    );
  };

  // 铺满不等于看得见：酒馆的顶栏与底部输入区是浮层，层级高过承载元素时界面会被压在下面。
  // 必须沿四周都探一遍。只探一个点会漏掉另一侧的浮层：桌面布局里阻挡元素是顶栏，
  // 手机布局里阻挡元素是底部输入区，探针留在顶部就会一路通过，尺寸明明铺满了却仍被压住。
  const 探针位置 = (): [number, number, string][] => [
    [2, 2, '左上'],
    [视口宽 - 3, 2, '右上'],
    [2, 视口高 - 3, '左下'],
    [视口宽 - 3, 视口高 - 3, '右下'],
    [视口宽 / 2, 2, '顶部'],
    [视口宽 / 2, 视口高 - 3, '底部'],
    [2, 视口高 / 2, '左侧'],
    [视口宽 - 3, 视口高 / 2, '右侧'],
    [视口宽 / 2, 视口高 / 2, '正中'],
  ];

  /** 探一圈，返回第一个压在界面之上的元素与它所在的方位 */
  const 挡住界面的 = (): { 元素: HTMLElement; 方位: string } | null => {
    if (!视口宽 || !视口高) {
      return null;
    }
    for (const [横, 纵, 方位] of 探针位置()) {
      const 命中 = 承载.ownerDocument.elementFromPoint(横, 纵);
      if (命中 && 命中 !== 承载) {
        return { 元素: 命中 as HTMLElement, 方位 };
      }
    }
    return null;
  };

  // 第一轮：百分比可能解析不到视口（祖先仍在构成包含块时就是如此），补一层按视口算出的像素尺寸
  let 补过像素 = false;
  if (!盖住了()) {
    承载.style.setProperty('width', `${视口宽}px`, 'important');
    承载.style.setProperty('height', `${视口高}px`, 'important');
    补过像素 = true;
  }

  // 第二轮：像素尺寸仍盖不住，说明包含块不在视口上。继续推断属性不如直接把偏差抵消：
  // 四个偏移量同时给出会互相过度约束，补偿位置时只留 top/left，用实测矩形把它们反推出来。
  if (!盖住了()) {
    const 盒 = 承载.getBoundingClientRect();
    承载.style.setProperty('right', 'auto', 'important');
    承载.style.setProperty('bottom', 'auto', 'important');
    承载.style.setProperty('top', `${-盒.top}px`, 'important');
    承载.style.setProperty('left', `${-盒.left}px`, 'important');
  }

  if (!盖住了()) {
    const 盒 = 承载.getBoundingClientRect();
    const 视口现场 = 读视口现场(承载);
    全屏失败.value =
      `承载界面的 iframe 没能铺满视口：实际 ${Math.round(盒.width)}×${Math.round(盒.height)}，` +
      `位置 上 ${Math.round(盒.top)}、左 ${Math.round(盒.left)}（目标都是 0），` +
      `视口 ${视口宽}×${视口高}${补过像素 ? '（已按视口补过像素宽高）' : ''}；` +
      `宿主滚动 ${视口现场.滚动}，视觉视口 ${视口现场.视觉}；${现场摘要(现场)}`;
    还原();
    return false;
  }

  // 探到阻挡元素的浮层就地清除：它们多半是承载元素的兄弟分支（酒馆的底部输入区就不在祖先链上，
  // 沿祖先链那一轮扫不到）。清除掉它自己与它祖先链的 z-index 与 isolation 后再探，
  // 最多三轮；仍压不住才判失败并报出方位，不再让铺满却看不见的界面在无提示的情况下通过。
  let 压住界面的 = 挡住界面的();
  for (let 轮 = 0; 轮 < 3 && 压住界面的; 轮++) {
    清层叠(压住界面的.元素);
    压住界面的 = 挡住界面的();
  }

  if (压住界面的) {
    全屏失败.value =
      `承载界面的 iframe 铺满了视口，但${压住界面的.方位}被上层元素压住：${描述(压住界面的.元素)}`;
    还原();
    return false;
  }

  全屏失败.value = '';
  return true;
};

/** 退出兜底铺满：把改过的样式与属性写回，清掉全屏类与安全区变量 */
const 退出铺满 = () => {
  还原();
  清安全区();
  document.documentElement.classList.remove('ls-全屏');
  是否全屏.value = false;
  全屏失败.value = '';
};

/**
 * 兜底铺满：常驻承载建不起来时，退回把承载界面的 iframe 铺满视口。
 *
 * 这条路径在楼层 iframe 被酒馆助手重建时会丢掉全屏，所以只当兜底。
 * 失败原因留在 `全屏失败` 里：全屏壳里看不到它，等玩家回到楼层紧凑面板就能看到，
 * 那时正好是这条路径失效、需要线索的时候。
 */
const 铺满兜底 = (原因: string) => {
  // 类必须在铺满之前添加：global.css 按这个类把 html、body 与 #ls-app 的高度链撑满，
  // 而酒馆助手的高度自适应脚本会按 body.scrollHeight 改写承载 iframe 的高度。
  // 高度链没撑满就铺满，脚本会把高度写成内容高度，全屏壳随即塌回内容高度。
  document.documentElement.classList.add('ls-全屏');
  if (!铺满()) {
    document.documentElement.classList.remove('ls-全屏');
    return;
  }

  应用安全区();
  是否全屏.value = true;
  全屏失败.value = `全屏承载没能建立，已退回铺满本楼层界面：${原因}`;
};

/** 进全屏：先建常驻承载，建不起来再退回铺满 */
const 进全屏 = async () => {
  // 嵌套实例只渲染楼层紧凑面板，不提供全屏入口；这里再挡一道，防止别处直接调进来
  if (是否嵌套) {
    return;
  }
  全屏失败.value = '';
  if (是否全屏.value) {
    return;
  }

  const 原因 = await 建常驻(取本楼层号());
  if (!原因) {
    return;
  }

  铺满兜底(原因);
};

/** 切换全屏：常驻实例退出全屏，楼层实例进入全屏 */
export const 切换全屏 = () => {
  if (是否常驻实例()) {
    // 常驻实例就是全屏壳本身，退出全屏就是销毁自己所在的承载框
    销毁常驻();
    return;
  }

  if (是否全屏.value) {
    退出铺满();
    return;
  }

  void 进全屏();
};

/** 接入全屏状态与安全区监听；在组件 setup 里调用 */
export const use全屏 = () => {
  const 同步安全区 = () => {
    if (是否全屏.value) {
      应用安全区();
    }
  };

  let 停切聊天: (() => void) | null = null;
  let 卸载时: (() => void) | null = null;

  onMounted(() => {
    if (是否常驻实例()) {
      应用安全区();

      // 页面卸载这一条由常驻承载自己接：浏览器卸载页面时会向每个 frame 各派发一次 pagehide，
      // 常驻承载收到就说明页面要走了，顺手把框摘掉。试过在楼层实例里挂宿主窗口的 pagehide，
      // 宿主窗口是跨文档引用，事件挂上去收不到，实测派发后监听器根本不执行。
      卸载时 = () => {
        销毁常驻();
      };
      window.addEventListener('pagehide', 卸载时);
    } else {
      // 回收上一次留下的宿主改动：承载界面的 iframe 被酒馆助手重建时旧文档的快照还在宿主 window 上，
      // 不回收的话宿主的滚动锁定与被清除为 auto 的层级会永久留着
      还原();

      // 常驻承载的生命周期绑定会话。退出全屏那条路在 切换全屏 里，
      // 切聊天那条路在这里接上：直接挂宿主事件源，理由见 常驻.ts 的 挂宿主事件。
      // 嵌套实例不建承载，也就不必接。
      if (!是否嵌套) {
        停切聊天 = 挂宿主事件(tavern_events.CHAT_CHANGED, 销毁常驻);
      }
    }

    // 旋转或视口变化后安全区与顶栏占位都会变，全屏期间要重新读一次
    window.addEventListener('resize', 同步安全区);
    window.addEventListener('orientationchange', 同步安全区);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', 同步安全区);
    window.removeEventListener('orientationchange', 同步安全区);
    if (卸载时) {
      window.removeEventListener('pagehide', 卸载时);
      卸载时 = null;
    }
    停切聊天?.();
    停切聊天 = null;

    // 常驻实例所在的文档被销毁时这里不会执行（移除 iframe 元素销毁的是整个文档，
    // Vue 得不到通知），它也不必执行：承载框正是被销毁的那一个
    if (!是否常驻实例() && 是否全屏.value) {
      退出铺满();
    }
  });

  return { 是否全屏, 全屏失败, 切换全屏 };
};
