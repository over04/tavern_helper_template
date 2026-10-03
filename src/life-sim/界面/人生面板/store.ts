import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

/**
 * 数据仓库取哪一层，按 iframe 类型决定，不做运行时试探。
 *
 * 楼层消息 iframe（名称前缀 TH-message--）有楼层上下文，取所在楼层，状态栏跟着楼层走；
 * 脚本 iframe（名称前缀 TH-script--）没有楼层上下文，getCurrentMessageId() 会抛错，
 * 取最新一层。'latest' 由 defineMvuDataStore 解析成 -1。
 */
const 楼层号: number | 'latest' = getIframeName().startsWith('TH-script--') ? 'latest' : getCurrentMessageId();

export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: 楼层号 });
