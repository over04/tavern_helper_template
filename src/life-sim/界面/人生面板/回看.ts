/**
 * 正文区的回看状态：当前回看的楼层与那一层的变量快照。
 *
 * 模块级响应式状态，正文区写入、游戏面板读取。回看层为 null 表示没有回看，
 * 面板显示当前状态；否则面板显示回看层那一层的快照，只读、不写变量。
 */

import { ref } from 'vue';
import type { Ref } from 'vue';

/** 当前回看的楼层号，null 表示没有回看 */
export const 回看层: Ref<number | null> = ref(null);

/** 当前回看楼层的变量快照，读不到时为 null */
export const 回看数据: Ref<Record<string, any> | null> = ref(null);
