/**
 * 楼层数据层：为判定条提供所在楼层与变量快照。
 *
 * 只做数据整理，不持有界面状态。
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

/** 楼层上下文：判定条脚本向判定条组件传递所在楼层与变量版本 */
export type 楼层上下文结构 = {
  /** 所在楼层，随楼层数据刷新而变化 */
  楼层: ComputedRef<楼层结构 | null>;
  /** 变量版本，变量表或楼层内容变化时自增 */
  变量版本: Ref<number>;
};

/** 楼层上下文的注入键，由判定条脚本提供、判定条组件取用 */
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
