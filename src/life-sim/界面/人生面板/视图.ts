import type { InjectionKey, Ref } from 'vue';

/**
 * 当前视图：终章结算优先，其次分钟推进、月推进，最后是开局。
 *
 * App.vue 按它决定中间列是否渲染、输入区与结算条是否出现，子组件注入同一个值，不各自判定。
 */
export type 视图名 = '终章' | '分钟推进' | '月推进' | '开局';

/** 注入键：App.vue 提供，游戏面板读取 */
export const 视图键: InjectionKey<Ref<视图名>> = Symbol('人生面板视图');
