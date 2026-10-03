/**
 * 全屏：把承载本界面的 iframe 铺满视口。
 *
 * 界面平时位于聊天楼层里，点「全屏」由本模块把承载它的 iframe 设成 position: fixed
 * 并铺满视口，同时锁住宿主文档的滚动；点「退出全屏」把改过的样式按原样写回。
 *
 * 不用浏览器的全屏 API：iOS 把全屏内容当作一次性展示，下滑是退出而不是滚动，
 * 还会常驻一条「Swipe down to exit」的系统横幅，网页侧没有 API 可以屏蔽。
 *
 * 宿主文档里的 transform、perspective、filter、will-change、contain 在取到会让元素成为包含块的值时，
 * 都会改变 position: fixed 的包含块，所以铺满时沿祖先链一律清成 none/auto，退出时写回。
 * 酒馆自己的样式写在 `html` 上、用的是 `-webkit-` 前缀；前缀属性与标准属性名不同，本就是两条声明，
 * 而引擎是否把前缀属性实现为标准属性的别名各不相同，所以两条都清，不依赖别名行为。
 */

import { onMounted, onUnmounted, ref } from 'vue';

/** 会让该元素成为 position: fixed 包含块的属性；前缀变体是另一条声明，一并清 */
const 包含块属性 = [
  'transform',
  '-webkit-transform',
  'perspective',
  '-webkit-perspective',
  'filter',
  '-webkit-filter',
  'backdrop-filter',
  '-webkit-backdrop-filter',
  'will-change',
  'contain',
];

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

/** 宿主文档：没有父文档时退回本文档，供弹窗与跨文档查询使用 */
export const 取宿主文档 = (): Document => 取父文档() ?? document;

/** 是否处于全屏 */
export const 是否全屏 = ref(false);

/** 改过的元素与原样式：退出时按原样写回，不残留改动 */
const 改前样式: { 元素: HTMLElement; cssText: string }[] = [];

/** 已记下的元素：同一个元素可能被清理两轮（祖先链一轮、宿主文档的滚动一轮），只留第一次的快照 */
const 已记下 = new Set<HTMLElement>();

const 记下 = (元素: HTMLElement) => {
  if (已记下.has(元素)) {
    return;
  }
  已记下.add(元素);
  改前样式.push({ 元素, cssText: 元素.style.cssText });
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

/** 把安全区写回界面根容器：铺满视口后界面会压到顶部凹口与底部横条上 */
const 应用安全区 = () => {
  const 根 = document.getElementById('ls-app');
  if (!根) {
    return;
  }
  const { 顶, 底 } = 读安全区();
  根.style.setProperty('--ls-safe-top', `${顶}px`);
  根.style.setProperty('--ls-safe-bottom', `${底}px`);
};

const 清安全区 = () => {
  const 根 = document.getElementById('ls-app');
  根?.style.removeProperty('--ls-safe-top');
  根?.style.removeProperty('--ls-safe-bottom');
};

/** 上一次铺满失败的原因，空串表示没有失败；界面把它显示出来，真机上出问题时有据可查 */
export const 全屏失败 = ref('');

/** 元素的简写，写诊断信息用 */
const 描述 = (元素: HTMLElement) => {
  const 标识 = 元素.id ? `#${元素.id}` : '';
  const 类 = typeof 元素.className === 'string' && 元素.className.trim() ? `.${元素.className.trim().split(/\s+/)[0]}` : '';
  return `${元素.tagName.toLowerCase()}${标识}${类}`;
};

/** 沿祖先链往上走一层，穿过 shadow 边界：parentElement 在 shadow 根处返回 null，链会断在那里 */
const 上一层 = (节点: Node): HTMLElement | null => {
  if (节点.parentElement) {
    return 节点.parentElement;
  }
  const 根 = 节点.getRootNode();
  return 根 instanceof ShadowRoot ? (根.host as HTMLElement) : null;
};

/** 找出第一个仍在构成包含块的祖先：真机上出现「铺不满」时，诊断信息用它定位到具体是哪一个祖先元素 */
const 找包含块祖先 = (元素: HTMLElement): string => {
  const 视图 = 元素.ownerDocument.defaultView;
  if (!视图) {
    return '';
  }
  for (let 当前: HTMLElement | null = 元素; 当前; 当前 = 上一层(当前)) {
    const 计算 = 视图.getComputedStyle(当前);
    for (const 属性 of 包含块属性) {
      const 值 = 计算.getPropertyValue(属性).trim();
      if (值 && 值 !== 'none' && 值 !== 'auto' && 值 !== 'normal') {
        return `${描述(当前)} 的 ${属性} 仍是 ${值}`;
      }
    }
  }
  return '';
};

/** 把一个元素及其祖先链上构成层叠上下文的部分清成 auto，并记进快照
 *  只清 z-index 与 isolation：flex/grid 子项上的 z-index 同样构成层叠上下文，而它的 position 是 static，
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

  // 沿祖先链清掉包含块属性，承载元素本身也在内
  for (let 元素: HTMLElement | null = 承载; 元素; 元素 = 上一层(元素)) {
    if (元素 !== 承载) {
      记下(元素);
    }
    for (const 属性 of 包含块属性) {
      元素.style.setProperty(属性, 属性 === 'will-change' ? 'auto' : 'none', 'important');
    }
  }

  // 祖先里凡是构成层叠上下文的，会把承载元素的 z-index 限制在该上下文内部：2147483000 只在那层上下文内部有效，
  // 对上下文之外（酒馆的顶栏与底部输入区）只相当于该上下文自身的层级，于是尺寸铺满了却还被压住。
  // 把这类祖先的 z-index 与 isolation 也清成 auto，承载元素就能在根层叠上下文里直接与它们比较层级高低。
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

  // 读回实际矩形做自检：真机上偶尔有祖先仍在构成包含块、或样式被别处盖掉，铺满会失败且不留任何提示
  const 视图 = 承载.ownerDocument.defaultView;
  const 视口宽 = 视图?.innerWidth ?? 0;
  // 手机浏览器上视觉视口可能比布局视口高，取两者较大的那个，自检才不会因为地址栏伸缩而误判
  const 视口高 = Math.max(视图?.innerHeight ?? 0, 视图?.visualViewport?.height ?? 0);
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
  // 必须沿四周都探一遍。只探一个点会漏掉另一侧的浮层：桌面布局挡路的是顶栏，
  // 手机布局挡路的是底部输入区，探针留在顶部就会一路通过，尺寸明明铺满了却仍被压住。
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

  if (!盖住了()) {
    // 百分比可能解析不到视口（祖先仍在构成包含块时就是如此），补一层按视口算出的像素尺寸
    承载.style.setProperty('width', `${视口宽}px`, 'important');
    承载.style.setProperty('height', `${视口高}px`, 'important');
  }

  if (!盖住了()) {
    const 盒 = 承载.getBoundingClientRect();
    const 挡路 = 找包含块祖先(承载);
    全屏失败.value =
      `承载界面的 iframe 没能铺满视口：实际 ${Math.round(盒.width)}×${Math.round(盒.height)}，` +
      `视口 ${视口宽}×${视口高}；${挡路 || '未找到构成包含块的祖先'}`;
    还原();
    return false;
  }

  // 探到挡路的浮层就地清扫：它们多半是承载元素的兄弟分支（酒馆的底部输入区就不在祖先链上，
  // 沿祖先链那一轮扫不到）。清掉它自己与它祖先链的 z-index 与 isolation 后再探，
  // 最多三轮；仍压不住才判失败并报出方位，不再让尺寸铺满了却看不见的界面静默通过。
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

const 还原 = () => {
  for (const { 元素, cssText } of 改前样式) {
    元素.style.cssText = cssText;
  }
  改前样式.length = 0;
  已记下.clear();
};

/** 切换全屏：已铺满就退出，否则把承载界面的 iframe 铺满视口 */
export const 切换全屏 = () => {
  if (是否全屏.value) {
    还原();
    清安全区();
    document.documentElement.classList.remove('ls-全屏');
    是否全屏.value = false;
    全屏失败.value = '';
    return;
  }

  全屏失败.value = '';
  if (!铺满()) {
    return;
  }

  应用安全区();
  // 全屏元素是父文档里的 iframe，本界面所在的文档里测不到它的尺寸，
  // 所以在根元素上挂一个类，global.css 按这个类把 html、body 与 #ls-app 的高度链撑满
  document.documentElement.classList.add('ls-全屏');
  是否全屏.value = true;
};

/** 接入全屏状态与安全区监听；在组件 setup 里调用 */
export const use全屏 = () => {
  const 同步安全区 = () => {
    if (是否全屏.value) {
      应用安全区();
    }
  };

  onMounted(() => {
    // 旋转或视口变化后安全区会变，铺满期间要重新读一次
    window.addEventListener('resize', 同步安全区);
    window.addEventListener('orientationchange', 同步安全区);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', 同步安全区);
    window.removeEventListener('orientationchange', 同步安全区);
    if (是否全屏.value) {
      还原();
      清安全区();
      document.documentElement.classList.remove('ls-全屏');
      是否全屏.value = false;
    }
  });

  return { 是否全屏, 全屏失败, 切换全屏 };
};
