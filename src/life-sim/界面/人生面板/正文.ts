/**
 * 正文区的数据层：楼层读取与显示格式转换。
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
 * 脚本占位标记。
 *
 * 酒馆的显示格式转换里有一段把成对引号包成 `<q>` 标签的处理，插进脚本内容后整段脚本
 * 会被随后的清洗丢掉。所以转换之前先把裸脚本换成这个标记，转换之后再换回来。
 * 标记只用字母与 `@`，不参与 Markdown 解析，也不会被引号处理碰到。
 */
const 脚本标记前缀 = '@@LSSCRIPT';
const 脚本标记后缀 = '@@';

/**
 * 把围栏代码块之外的裸脚本抽出来，换成占位标记。
 *
 * 围栏代码块里的内容会被酒馆转成代码文本，不受引号处理影响，所以不动它；
 * 若一并抽出，代码块的原文会被改掉，酒馆助手识别「前端代码块」的那一步就失效了。
 */
function 抽脚本(文本: string): { 文本: string; 脚本表: string[] } {
  const 脚本表: string[] = [];
  const 结果 = 文本
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map(段 => {
      if (段.startsWith('```') || 段.startsWith('~~~')) {
        return 段;
      }
      return 段.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, 命中 => {
        const 序号 = 脚本表.length;
        脚本表.push(命中);
        return `${脚本标记前缀}${序号}${脚本标记后缀}`;
      });
    })
    .join('');

  return { 文本: 结果, 脚本表 };
}

/** 把占位标记换回脚本原文 */
function 还脚本(文本: string, 脚本表: string[]): string {
  if (脚本表.length === 0) {
    return 文本;
  }

  const 匹配器 = new RegExp(`${脚本标记前缀}(\\d+)${脚本标记后缀}`, 'g');
  return 文本.replace(匹配器, (_命中, 序号: string) => 脚本表[Number(序号)] ?? '');
}

/**
 * 把楼层原文转成酒馆的显示格式，但保留脚本与 iframe。
 *
 * 正文区的楼层整条交给嵌套 iframe 渲染，正文里的脚本必须保住，所以不能走
 * `formatAsDisplayedMessage`：它不接受清洗参数，`<script>` 与 `<iframe>` 会被整段剥除。
 * 这里直接调用酒馆原生的 `messageFormatting`，把这两类标签加入允许清单。
 * 正则替换、宏替换、Markdown 转换与样式作用域都由这一个函数完成，与酒馆楼层是同一份实现。
 *
 * 裸脚本还要额外保护：酒馆在转换过程中会把成对引号包成 `<q>`，插进脚本后整段脚本会被丢掉。
 *
 * 转换后样式选择器会带上 `.mes_text ` 前缀，嵌套文档里用同名容器包住正文即可命中。
 * 楼层号越界等情况下酒馆会抛错，这里退回原文，避免整段正文渲染不出来。
 *
 * @param 楼层 要转换的楼层
 * @returns 转换后的正文 HTML；转换不可用时返回原文
 */
export function 转未清洗显示(楼层: 楼层结构): string {
  const 原文 = 楼层.原文;
  if (!原文) {
    return '';
  }

  const { 文本: 待转文本, 脚本表 } = 抽脚本(原文);

  try {
    const 格式化 = SillyTavern.messageFormatting;
    if (typeof 格式化 !== 'function') {
      return 原文;
    }

    const 转换后 = 格式化(
      待转文本,
      楼层.名称,
      楼层.角色 === 'system',
      楼层.角色 === 'user',
      楼层.楼层号,
      { ADD_TAGS: ['script', 'iframe', 'custom-style'] },
    );

    return 还脚本(转换后, 脚本表);
  } catch (错误) {
    console.error('人生面板：转换正文显示格式失败', 错误);
    return 原文;
  }
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
