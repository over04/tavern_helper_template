/**
 * 嵌套楼层文档的拼装。
 *
 * 全屏正文区一次只显示一条楼层，整条楼层放进一个由 Vue 模板创建的嵌套 iframe 渲染：
 * 正文里的脚本只有在真 iframe 里才会执行，写在 `v-html` 的字符串里只会留在 DOM 中不执行。
 *
 * 拼装顺序与酒馆助手对「前端代码块」的做法一致：文档骨架、基础样式重置、第三方库、
 * 预定义注入、正文内容，最后是高度回写。层级上这里是第三层文档：
 * 酒馆主文档 → 承载界面的楼层 iframe → 本 iframe。预定义注入全部按 `window.parent` 取对象，
 * 在嵌套一层的情况下取到的正是承载界面的那一层，接口照样可用，所以直接内联酒馆助手那份源码。
 *
 * 楼层正文里的前端代码块（```html 围栏）在嵌套文档里同样需要二次成帧，这一层由
 * `运行时外壳` 里的扫描器就地完成，判定条件与酒馆助手的 `isFrontend` 一致。
 */

/** 正文容器类名：酒馆给正文样式加的作用域前缀就是它，正文里的样式选择器要挂在它之下才会命中 */
export const 正文容器类 = 'mes_text';

/**
 * 标签拼接。
 *
 * 这几个标签一律不能写成字面量，原因有两条，都会造成真实故障：
 *
 * 一是产物里的脚本会被内联进楼层文档，字符串中若出现脚本结束标签，HTML 解析器会把它
 * 当成脚本的结尾，后面的代码全部落到脚本之外；
 * 二是产物里的脚本是内联在页面里的，按文本查找 `<style>`、`<body>`、`<head>` 的解析方式
 * 会先命中脚本里的字符串，提取出来的文档结构整个错位。
 */
const 包 = (标签与属性: string): string => '<' + 标签与属性 + '>';
const 合 = (名: string): string => '<' + '/' + 名 + '>';

const 脚本开始 = 包('script');
const 脚本结束 = 合('script');

/**
 * 基础样式重置：与酒馆助手拼装界面文档时用的那一份一致。
 *
 * 目的是让内部内容的高度测量准确：`html` 与 `body` 的滚动被关掉，`scrollHeight` 反映的
 * 就纯粹是内容高度，高度回写不会被视口高度干扰。
 */
const 基础样式 = `*,*::before,*::after{box-sizing:border-box;}
html,body{margin:0!important;padding:0;overflow:hidden!important;max-width:100%!important;}`;

/** 预定义注入：酒馆助手 `src/iframe/predefine.js` 的源码，逐字内联 */
const 预定义源码 = `window._ = window.parent._;
const iframeId = window.frameElement?.id || window.name;
if (iframeId) {
  // 记下 iframe 的标识：srcdoc iframe 在导航时可能丢掉 frameElement，window.name 能存活得更久
  window.__TH_IFRAME_ID = iframeId;
  if (!window.name) {
    window.name = iframeId;
  }
}
let result = _(window);
result = result.merge(_.pick(window.parent, ['EjsTemplate', 'TavernHelper', 'YAML', 'showdown', 'toastr', 'z']));
result = result.merge(_.omit(_.get(window.parent, 'TavernHelper'), '_bind'));
result = result.merge(
  ...Object.entries(_.get(window.parent, 'TavernHelper')._bind).map(([key, value]) => ({
    [key.replace('_', '')]: value.bind(window),
  })),
);
result.value();

// pinia 4.0.0 起必须设置这几个标记
_.set(window, '__VUE_PROD_DEVTOOLS__', true);
_.set(window, '__VUE_OPTIONS_API__', true);
_.set(window, '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__', false);

Object.defineProperty(window, 'SillyTavern', {
  get: () => {
    const SillyTavern = _.get(window.parent, 'SillyTavern');
    const getContext = () => {
      return { ...SillyTavern.getContext(), writeExtensionField: _th_impl.writeExtensionField };
    };
    return { ...getContext(), getContext };
  },
});

// Mvu 由酒馆主文档提供，这里只做转发
if (_.has(window.parent, 'Mvu')) {
  Object.defineProperty(window, 'Mvu', {
    get: () => _.get(window.parent, 'Mvu'),
    set: () => {},
    configurable: true,
  });
}

$(window).on('pagehide', () => {
  eventClearAll();
});`;

/**
 * 酒馆站点根地址：嵌套文档里的本机资源按它拼绝对地址。
 *
 * 嵌套文档都是 `about:srcdoc`，它的 `location.origin` 是字符串 `'null'`，直接拿来拼会得到
 * `/null/scripts/...` 这种地址。所以沿框架链往上找到第一个有真实源的同源窗口。
 */
function 站点根(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let 窗口: Window | null = window;
  while (窗口) {
    try {
      const 源 = 窗口.location.origin;
      if (源 && 源 !== 'null') {
        return 源;
      }
    } catch {
      // 跨源窗口读不了 location，继续往上找
    }

    if (窗口.parent === 窗口) {
      break;
    }
    窗口 = 窗口.parent;
  }

  return '';
}

/** tailwind 的本机地址：酒馆助手自带一份，不必再走 CDN */
function tailwind地址(): string {
  return `${站点根()}/scripts/extensions/third-party/JS-Slash-Runner/lib/tailwindcss.min.js`;
}

/**
 * 第三方库：与酒馆助手注入的一套对齐。
 *
 * 基础库（jQuery、lodash、Vue、vue-router）不在这里加载，而是由 `公共段` 从承载界面的
 * 那一层搬过来——宿主已经加载过一份，重复加载既慢，版本也可能不一致。
 * jQuery 插件（jQuery UI、触摸拖拽）挂在同一份 `$.fn` 上，搬 jQuery 就一并获得。
 */
function 拼第三方标签(): string {
  return [
    '<link rel="stylesheet" href="https://testingcf.jsdelivr.net/npm/@fortawesome/fontawesome-free/css/all.min.css" />',
    `${包(`script src="${tailwind地址()}"`)}${脚本结束}`,
  ].join('\n');
}

/** 基础库搬运与预定义注入：第二层与第三层共用这一段 */
/**
 * 运行时启动段：放在正文之后。
 *
 * 扫描必须在正文进入 DOM 之后进行，所以不能和运行时外壳一起放在 head 里。
 * 第三层文档没有扫描器定义，这里用类型检查兜住，找不到就跳过。
 */
const 运行时启动 = `(function () {
  function 跑() {
    try {
      if (typeof window.__ls扫描前端代码块 === 'function') {
        window.__ls扫描前端代码块();
      }
    } catch (错误) {
      console.warn('人生面板：渲染前端代码块失败', 错误);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', 跑);
  }
  跑();
})();`;

const 公共段 = `(function () {
  var 父 = window.parent || window;
  try {
    if (父.$) { window.$ = 父.$; }
    if (父.jQuery) { window.jQuery = 父.jQuery; }
    if (父._) { window._ = 父._; }
    if (父.Vue) { window.Vue = 父.Vue; }
    if (父.VueRouter) { window.VueRouter = 父.VueRouter; }
  } catch (错误) {
    console.warn('人生面板：基础库搬运失败', 错误);
  }

  // 宿主没有酒馆助手时（例如本地预览）这一段会抛错，包住它，后面的内容照常渲染
  try {
${预定义源码}
  } catch (错误) {
    console.warn('人生面板：预定义注入失败', 错误);
  }
})();`;

/**
 * 高度回写：在 iframe 内部直接写宿主 iframe 元素的高度。
 *
 * `frameElement` 就是本 iframe 的宿主元素，同源可以直接写，不需要跨层通信。
 * 写的是内联样式，所以界面这一侧的样式表不能给嵌套 iframe 设固定高度。
 */
const 高度回写源码 = `(function () {
  function 量高() {
    try {
      var 体 = document.body;
      var 框 = window.frameElement;
      if (!体 || !框) { return; }
      var 高 = 体.scrollHeight;
      if (!isFinite(高) || 高 <= 0) { return; }
      框.style.height = 高 + 'px';
    } catch (错误) {
      // 跨文档写入被拒绝时保持原高度，内容本身照常显示
    }
  }

  var 已排 = false;
  function 安排() {
    if (已排) { return; }
    if (typeof window.requestAnimationFrame !== 'function') { 量高(); return; }
    已排 = true;
    window.requestAnimationFrame(function () { 已排 = false; 量高(); });
  }

  var 已开始 = false;
  function 开始() {
    if (已开始) { return; }
    已开始 = true;
    量高();
    // 图片、字体到位后内容高度还会变，观察 body 覆盖后续变化
    if (typeof ResizeObserver === 'function' && document.body) {
      new ResizeObserver(安排).observe(document.body);
    }
  }

  // 脚本在正文之后执行，此时 DOM 已经就绪，可以直接开始；再挂一次监听兜住极端时序
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', 开始);
  }
  开始();
  window.addEventListener('load', 量高);
})();`;

/**
 * 运行时外壳：第二层文档的脚本。
 *
 * 三件事：搬基础库并做预定义注入；把拼装第三层文档所需的材料交给 `window.__ls拼文档`；
 * 扫描正文里的前端代码块，就地建第三层 iframe。
 */
const 运行时外壳 = `(function () {
${公共段}

  // 与模块里那两个常量同理：这些标签只能拼出来，写成字面量会被按文本查找的解析抢先命中
  var 包 = function (标签与属性) { return '<' + 标签与属性 + '>'; };
  var 合 = function (名) { return '<' + '/' + 名 + '>'; };

  var 站点 = ${JSON.stringify(站点根())};
  var 资源 = {
    基础样式: ${JSON.stringify(基础样式)},
    公共段: ${JSON.stringify(公共段)},
    启动: ${JSON.stringify(运行时启动)},
    高度回写: ${JSON.stringify(高度回写源码)},
  };

  function 拼第三方标签() {
    return '<link rel="stylesheet" href="https://testingcf.jsdelivr.net/npm/@fortawesome/fontawesome-free/css/all.min.css" />'
      + '\\n'
      + 包('script src="' + 站点 + '/scripts/extensions/third-party/JS-Slash-Runner/lib/tailwindcss.min.js"')
      + 合('script');
  }

  // 第三层文档由这里拼：楼层正文里的前端代码块要成为可执行的界面，就得再进一个真 iframe。
  // 结构与外层一致：公共段在 head 里先跑，正文里的脚本才用得上搬运来的库；
  // 启动段、高度回写与第三方标签放在正文之后，避免外链样式阻塞脚本执行。
  window.__ls拼文档 = function (内容, 额外样式) {
    return [
      '<!DOCTYPE html>',
      包('html'),
      包('head'),
      包('meta charset="utf-8"'),
      包('meta name="viewport" content="width=device-width, initial-scale=1.0"'),
      包('style'),
      资源.基础样式,
      额外样式 || '',
      合('style'),
      包('script'),
      资源.公共段,
      合('script'),
      合('head'),
      包('body'),
      内容,
      包('script'),
      资源.启动,
      合('script'),
      包('script'),
      资源.高度回写,
      合('script'),
      拼第三方标签(),
      合('body'),
      合('html'),
    ].join('\\n');
  };

  // 判定条件与酒馆助手的 isFrontend 一致：文本里出现这三段之一即算前端代码块。
  // 这里可以写开始标签的字面量，因为全文没有与之配对的结束标签字面量，不会被误匹配成完整标签。
  function 是前端代码块(文本) {
    return 文本.indexOf('html>') >= 0 || 文本.indexOf('<head>') >= 0 || 文本.indexOf('<body') >= 0;
  }

  function 建界面(代码) {
    var 包裹 = document.createElement('div');
    包裹.className = 'TH-render';
    var 框 = document.createElement('iframe');
    框.className = 'ls-嵌套界面';
    框.setAttribute('frameborder', '0');
    框.srcdoc = window.__ls拼文档(代码, '');
    包裹.appendChild(框);
    return 包裹;
  }

  function 扫描前端代码块() {
    var 表 = document.querySelectorAll('pre');
    for (var 序 = 0; 序 < 表.length; 序++) {
      var 块 = 表[序];
      if (块.closest('.TH-render')) { continue; }
      var 码 = 块.querySelector('code');
      var 文本 = (码 || 块).textContent || '';
      if (!是前端代码块(文本)) { continue; }
      var 包裹 = 建界面(文本);
      块.parentNode.insertBefore(包裹, 块);
      包裹.appendChild(块);
      // 原文与酒馆助手的做法一致：代码块留在原处但收起，界面上只看到渲染结果
      块.style.display = 'none';
    }
  }

  // 本段在 head 里执行，正文里的脚本要用到搬运来的库，必须排在它前面。
  // 扫描交给正文之后的启动段：那时 DOM 才就绪。
  window.__ls扫描前端代码块 = 扫描前端代码块;
})();`;

/**
 * 拼一份嵌套文档。
 *
 * 运行时外壳放在 `<head>`：正文里的脚本要用到它搬运来的 jQuery 等库，必须排在它之后。
 * 扫描启动段、高度回写与第三方标签放在正文之后：`<head>` 里的外链样式会阻塞后续脚本的执行，
 * 字体图标库走 CDN，一旦慢或不可达，正文里的脚本就一直不跑，正文区会停在半成品状态。
 */
function 拼文档(内容: string, 额外样式: string): string {
  return [
    '<!DOCTYPE html>',
    包('html'),
    包('head'),
    包('meta charset="utf-8"'),
    包('meta name="viewport" content="width=device-width, initial-scale=1.0"'),
    包('style'),
    基础样式,
    额外样式,
    合('style'),
    脚本开始,
    运行时外壳,
    脚本结束,
    合('head'),
    包('body'),
    内容,
    脚本开始,
    运行时启动,
    脚本结束,
    脚本开始,
    高度回写源码,
    脚本结束,
    拼第三方标签(),
    合('body'),
    合('html'),
  ].join('\n');
}

/**
 * 正文排版。
 *
 * 嵌套文档是独立文档，界面那一侧的样式表与 CSS 变量都进不来，所以字体、字号、行高与
 * 颜色在这里各写一份。字体与颜色取自 `global.css` 的同名变量，改动时两处须同步。
 */
function 拼正文样式(字号: number, 行高: number): string {
  return `html,body{background:transparent;}
body{
  font-family:'Tiempos Text','Songti SC','Noto Serif SC','Source Han Serif SC',Georgia,serif;
  font-size:${字号}px;
  line-height:${行高};
  color:#3d3d3a;
  overflow-wrap:anywhere;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.${正文容器类} p{margin:0 0 0.7em;}
.${正文容器类} p:last-child{margin-bottom:0;}
.${正文容器类} em{font-style:italic;}
.${正文容器类} strong{font-weight:600;color:#141413;}
.${正文容器类} code{
  padding:1px 5px;
  border-radius:6px;
  background:#f0eee6;
  font-family:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace;
  font-size:0.9em;
}
.${正文容器类} blockquote{
  margin:0 0 0.7em;
  padding-left:10px;
  border-left:2px solid #d5d3cc;
  color:#6c6b68;
}
.${正文容器类} img{max-width:100%;height:auto;}
.${正文容器类} table{border-collapse:collapse;max-width:100%;}
.${正文容器类} th,.${正文容器类} td{border:1px solid #e5e4df;padding:4px 8px;}
/* 前端代码块渲染出来的界面：宽度占满，高度由嵌套文档自己回写 */
.ls-嵌套界面{display:block;width:100%;border:0;}
`;
}

/**
 * 拼一条楼层的嵌套文档。
 *
 * @param 正文 已转成酒馆显示格式、且保留脚本的楼层正文 HTML
 * @param 字号 正文的字号，取自玩家设置
 * @param 行高 正文的行高，取自玩家设置
 * @returns 可直接交给 iframe 的 `srcdoc` 的完整文档
 */
export function 拼嵌套文档(正文: string, 字号: number, 行高: number): string {
  // 正文包一层同名容器：酒馆给样式选择器加的作用域前缀就是它，不包就一条都命不中
  const 内容 = 正文 ? `<div class="${正文容器类}">${正文}</div>` : '';
  return 拼文档(内容, 拼正文样式(字号, 行高));
}
