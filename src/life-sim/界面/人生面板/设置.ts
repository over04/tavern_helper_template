/**
 * 界面的玩家级设置，存全局变量，不进 stat_data。
 *
 * 设置状态是模块级响应式单例：设置页写回之后，其余组件立刻跟着变。
 */

import { ref } from 'vue';

export type 设置 = {
  /** 结算前提醒：事件尚未选择选项时，点「以此生开始」先弹一次确认 */
  结算前提醒: boolean;
  /** 动效开关：关闭后不播放入场淡入与页签浮现 */
  动效: boolean;
};

export const 默认设置: 设置 = {
  结算前提醒: true,
  动效: true,
};

const 全局表 = (): Record<string, any> => {
  try {
    return getVariables({ type: 'global' }) || {};
  } catch (error) {
    console.error('人生面板：读取全局变量失败', error);
    return {};
  }
};

export const 读设置 = (): 设置 => {
  const 存 = 全局表().人生面板设置;
  return { ...默认设置, ...(存 && typeof 存 === 'object' ? 存 : {}) };
};

/** 设置状态：模块级单例，由全局变量初始化，写回时同步更新 */
export const 设置状态 = ref<设置>(读设置());

export const 写设置 = (设置: 设置) => {
  const 全局 = 全局表();
  _.set(全局, ['人生面板设置'], { ...设置 });
  try {
    replaceVariables(全局, { type: 'global' });
  } catch (error) {
    console.error('人生面板：写入设置失败', error);
  }
  设置状态.value = { ...设置 };
};
