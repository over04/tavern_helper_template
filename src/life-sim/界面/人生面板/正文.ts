/**
 * 正文区的数据层：楼层读取、显示格式转换、判定标签切分与状态栏占位符剔除。
 *
 * 这份代码在全屏界面与楼层界面里共用，只做数据整理，不持有界面状态。
 */

import { ref } from 'vue';
import type { ComputedRef, InjectionKey, Ref } from 'vue';

/** 一条楼层在渲染时需要的字段，取自酒馆助手的 `getChatMessages` */
export type 楼层结构 = {
  /** 楼层号，与酒馆的消息下标一致 */
  楼层号: number;
  /** 发送者身份 */
  角色: 'system' | 'assistant' | 'user';
  /** 发送者名称 */
  名称: string;
  /** 正文原文，尚未转换为酒馆显示格式 */
  原文: string;
  /** 是否被隐藏 */
  隐藏: boolean;
  /** 当前选中的消息页下标，从 0 开始 */
  消息页: number;
  /** 该楼层的消息页总数 */
  消息页数: number;
};

/** 正文片段：文本片段走酒馆显示格式，判定片段交给判定条组件渲染 */
export type 正文片段 = { 类型: '文本'; 内容: string } | { 类型: '判定'; 序号: number };

/** 楼层上下文：楼层条向判定条传递所在楼层与变量版本 */
export type 楼层上下文结构 = {
  /** 所在楼层，随正文区的数据刷新而变化 */
  楼层: ComputedRef<楼层结构 | null>;
  /** 变量版本，变量表或楼层内容变化时自增 */
  变量版本: Ref<number>;
};

/** 楼层上下文的注入键，由楼层条提供、判定条取用 */
export const 楼层上下文键: InjectionKey<楼层上下文结构> = Symbol('人生面板楼层上下文');

/** 变量版本：变量表或楼层内容变化时自增，判定条据此重新读取 `$参数.本次判定` */
export const 变量版本 = ref(0);

/** 判定标签：`<判定:2/>`，同时兼容 `<判定:2>` 与 `</判定>` 收尾的写法 */
const 判定标签源 = '<判定\\s*[:：]\\s*(\\d+)\\s*\\/?>(?:\\s*<\\/判定>)?';

/**
 * 读取一段楼层。
 *
 * @param 起始 起始楼层号，负数按 0 处理
 * @param 条数 最多读取多少层
 * @returns 按楼层号从低到高排列的楼层数组，范围内没有楼层时返回空数组
 */
export function 读楼层(起始: number, 条数: number): 楼层结构[] {
  const 末层 = getLastMessageId();
  if (末层 < 0 || 条数 <= 0) {
    return [];
  }

  const 起 = Math.max(0, Math.floor(起始));
  const 止 = Math.min(末层, 起 + Math.floor(条数) - 1);
  if (止 < 起) {
    return [];
  }

  return getChatMessages(`${起}-${止}`, { include_swipes: true }).map(消息 => {
    const 条目 = 消息 as ChatMessageSwiped & Partial<ChatMessage>;
    return {
      楼层号: 条目.message_id,
      角色: 条目.role,
      名称: 条目.name,
      原文: 条目.message ?? 条目.swipes?.[条目.swipe_id ?? 0] ?? '',
      隐藏: Boolean(条目.is_hidden),
      消息页: 条目.swipe_id ?? 0,
      消息页数: 条目.swipes?.length ?? 1,
    };
  });
}

/**
 * 把正文原文转成酒馆的显示格式，即替换酒馆宏、应用酒馆正则、转成 HTML。
 *
 * 楼层号超出已有范围时酒馆助手会抛错，这里退回原文，避免整段正文渲染不出来。
 */
export function 转显示(文本: string, 楼层号: number): string {
  if (!文本) {
    return '';
  }
  try {
    return formatAsDisplayedMessage(文本, { message_id: 楼层号 });
  } catch (错误) {
    console.error('人生面板：转换正文显示格式失败', 错误);
    return 文本;
  }
}

/**
 * 按 `<判定:N/>` 把正文切成片段，供正文区自行渲染判定条。
 *
 * 全屏界面里的判定条不由楼层里的那条正则渲染，所以在调用 `转显示` 之前先切分，
 * 让判定标签留在界面这一侧处理。
 */
export function 切判定标签(文本: string): 正文片段[] {
  const 片段表: 正文片段[] = [];
  if (!文本) {
    return 片段表;
  }

  const 匹配器 = new RegExp(判定标签源, 'g');
  let 上次结尾 = 0;
  let 命中 = 匹配器.exec(文本);
  while (命中) {
    if (命中.index > 上次结尾) {
      片段表.push({ 类型: '文本', 内容: 清收尾(文本.slice(上次结尾, 命中.index)) });
    }

    const 序号 = Number(命中[1]);
    片段表.push({ 类型: '判定', 序号: Number.isFinite(序号) && 序号 >= 1 ? 序号 : 1 });
    上次结尾 = 命中.index + 命中[0].length;
    命中 = 匹配器.exec(文本);
  }

  if (上次结尾 < 文本.length) {
    片段表.push({ 类型: '文本', 内容: 清收尾(文本.slice(上次结尾)) });
  }
  return 片段表;
}

/** 未配对的收尾标签没有对应的开标签，一并清除 */
function 清收尾(内容: string): string {
  return 内容.replace(/<\/判定>/g, '');
}

/**
 * 剔除状态栏占位符对应的内容。
 *
 * 全屏界面里的面板独立渲染，正文里不再重复显示状态栏，所以占位符本身与它被
 * 酒馆正则替换后留下的容器都要去掉。
 */
export function 剔占位符(文本: string): string {
  if (!文本) {
    return '';
  }

  return 文本
    .replace(/<StatusPlaceHolderImpl\s*\/?>/gi, '')
    .replace(/<div\s+id=["']ls-app["'][^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div\s+class=["']ls-judge-root["'][^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<head>[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * 读取某一楼层的变量快照。
 *
 * @param 楼层号 要读取的楼层
 * @returns 该楼层的 `stat_data`，楼层不存在或没有变量时返回 null
 */
export function 读快照(楼层号: number): Record<string, any> | null {
  try {
    const 快照 = _.get(Mvu.getMvuData({ type: 'message', message_id: 楼层号 }), 'stat_data');
    return 快照 && typeof 快照 === 'object' ? (快照 as Record<string, any>) : null;
  } catch (错误) {
    console.error('人生面板：读取楼层变量失败', 错误);
    return null;
  }
}
