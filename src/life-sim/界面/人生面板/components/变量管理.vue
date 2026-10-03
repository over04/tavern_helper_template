<script lang="ts">
/** 字段的取值类型，与 字段控件.vue 的字段类型一致 */
type 字段类型 = 'number' | 'enum' | 'boolean' | 'string' | 'object' | 'array';

/** 字段的编辑元数据，与 字段控件.vue 的字段结构一致 */
type 字段结构 = {
  结构: 字段类型;
  下限?: number;
  上限?: number;
  步长?: number;
  枚举?: string[];
  长文本?: boolean;
  子字段?: Record<string, 字段结构>;
  值结构?: 字段结构;
  动态?: boolean;
  条目上限?: number;
  标签?: string;
  说明?: string;
  只读?: boolean;
};

/** 一个顶层分组：分组键即 schema 的顶层键，直接用于读写变量 */
type 分组 = {
  键: string;
  名称: string;
  标注?: string;
  摘要?: string;
  默认折叠?: boolean;
  字段: 字段结构;
};
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '../store';
import FieldControl from './字段控件.vue';

/** 六项先天，天赋与判定取项共用同一份名单 */
const 先天项 = ['智商', '情商', '体质', '颜值', '意志', '幸运'];

/** 学识与技能共用同一套学科分类 */
const 学科类 = ['数学', '语言', '自然科学', '工程技术', '医学', '人文', '社会科学', '艺术', '体育', '技艺'];

/** 难度五档，事件选项与判定结果共用同一份名单 */
const 难度档 = ['轻松', '容易', '普通', '困难', '极难'];

/** 学识与技能共用同一个条目结构 */
const 学业条目: 字段结构 = {
  结构: 'object',
  子字段: {
    层级: { 结构: 'number', 下限: 0, 上限: 9 },
    进度: { 结构: 'number', 下限: 0, 上限: 100 },
    上限: { 结构: 'number', 下限: 0, 上限: 9, 说明: '这一条目的层级上限' },
    类: { 结构: 'enum', 枚举: 学科类 },
    教育质量: { 结构: 'number', 下限: 0.5, 上限: 2, 步长: 0.1 },
  },
};

/** 资产条目：数量与来源都是文字，不按数字处理 */
const 资产条目: 字段结构 = {
  结构: 'object',
  子字段: {
    数量: { 结构: 'string' },
    来源: { 结构: 'string' },
  },
};

/** 六项先天的编辑结构 */
const 先天字段: 字段结构 = {
  结构: 'object',
  子字段: {
    智商: { 结构: 'number', 下限: 0, 上限: 100 },
    情商: { 结构: 'number', 下限: 0, 上限: 100 },
    体质: { 结构: 'number', 下限: 0, 上限: 100 },
    颜值: { 结构: 'number', 下限: 0, 上限: 100 },
    意志: { 结构: 'number', 下限: 0, 上限: 100 },
    幸运: { 结构: 'number', 下限: 0, 上限: 100 },
  },
};

const 分组列表: 分组[] = [
  {
    键: '时间',
    名称: '时间',
    摘要: '回合推进与年龄读数',
    字段: {
      结构: 'object',
      子字段: {
        回合: { 结构: 'number', 下限: 0, 上限: 9999, 说明: '已推进的回合数，0 表示尚未开局' },
        年: { 结构: 'number', 下限: 1, 上限: 9999 },
        月: { 结构: 'number', 下限: 1, 上限: 12 },
        跨度: { 结构: 'number', 下限: 1, 上限: 60, 说明: '每个回合推进的月数' },
        模式: { 结构: 'enum', 枚举: ['月推进', '分钟推进'] },
        日: { 结构: 'number', 下限: 0, 上限: 31, 说明: '0 表示时间未具体到日' },
        时: { 结构: 'number', 下限: 0, 上限: 23 },
        分: { 结构: 'number', 下限: 0, 上限: 59 },
        慢速累计: { 结构: 'number', 下限: 0, 上限: 999999, 说明: '分钟推进模式下本段累计的分钟数' },
        年龄岁: { 结构: 'number', 下限: 0, 上限: 150 },
        年龄月: { 结构: 'number', 下限: 0, 上限: 11 },
        阶段: {
          结构: 'enum',
          枚举: ['新生儿', '幼年', '童年', '少年', '青年', '成年', '中年', '壮年', '老年', '暮年'],
        },
      },
    },
  },
  {
    键: '_性别',
    名称: '性别',
    摘要: '出生即定，不随回合变化',
    字段: { 结构: 'enum', 枚举: ['男', '女'] },
  },
  {
    键: '姓名',
    名称: '姓名',
    摘要: '玩家姓名，改名或用别名时更新',
    字段: { 结构: 'string', 长文本: true },
  },
  {
    键: '_先天',
    名称: '先天',
    摘要: '六项天赋，出生即定',
    字段: 先天字段,
  },
  {
    键: '状态',
    名称: '状态',
    摘要: '健康为生命值，降为 0 即死亡',
    字段: {
      结构: 'object',
      子字段: {
        健康: { 结构: 'number', 下限: 0, 上限: 100 },
        气度: { 结构: 'number', 下限: 0, 上限: 100, 说明: '不占精力份额' },
        声望: { 结构: 'number', 下限: 0, 上限: 100 },
        幸福: { 结构: 'number', 下限: 0, 上限: 100 },
      },
    },
  },
  {
    键: '焦点',
    名称: '焦点',
    摘要: '领域名 → 本回合的精力份额',
    字段: {
      结构: 'object',
      动态: true,
      值结构: { 结构: 'number', 下限: 0, 上限: 1.5, 步长: 0.1 },
    },
  },
  {
    键: '学识',
    名称: '学识',
    摘要: '学科名到层级、进度与教育质量',
    字段: { 结构: 'object', 动态: true, 值结构: 学业条目 },
  },
  {
    键: '技能',
    名称: '技能',
    摘要: '技能名到层级、进度与教育质量',
    字段: { 结构: 'object', 动态: true, 值结构: 学业条目 },
  },
  {
    键: '关系',
    名称: '关系',
    摘要: '人物姓名到身份、阶段与亲密度',
    字段: {
      结构: 'object',
      动态: true,
      值结构: {
        结构: 'object',
        子字段: {
          身份: { 结构: 'string' },
          阶段: { 结构: 'string' },
          亲密度: { 结构: 'number', 下限: -100, 上限: 100 },
        },
      },
    },
  },
  {
    键: '家庭资产',
    名称: '家庭资产',
    摘要: '资产名到数量与来源',
    字段: { 结构: 'object', 动态: true, 值结构: 资产条目 },
  },
  {
    键: '个人资产',
    名称: '个人资产',
    摘要: '资产名到数量与来源',
    字段: { 结构: 'object', 动态: true, 值结构: 资产条目 },
  },
  {
    键: '事件',
    名称: '事件',
    摘要: '事件名到细节、时间与选项',
    字段: {
      结构: 'object',
      动态: true,
      值结构: {
        结构: 'object',
        子字段: {
          细节段落: { 结构: 'string', 长文本: true },
          发生时间: { 结构: 'string' },
          截止时间: { 结构: 'string' },
          所属主题: { 结构: 'string' },
          选项: {
            结构: 'object',
            动态: true,
            说明: '键为选项名，取「一」到「四」',
            值结构: {
              结构: 'object',
              子字段: {
                动作: { 结构: 'string', 长文本: true },
                代价: { 结构: 'string', 长文本: true },
                难度: { 结构: 'enum', 枚举: 难度档 },
                取项: { 结构: 'enum', 枚举: 先天项, 说明: '这项行动取哪一项先天' },
                主项: { 结构: 'string', 说明: '学识或技能条目名，生活领域留空' },
                领域: { 结构: 'string', 说明: '焦点里的领域名' },
              },
            },
          },
        },
      },
    },
  },
  {
    键: '心向',
    名称: '心向',
    摘要: '3~6 条方向，超出时保留最新的方向',
    字段: { 结构: 'array', 值结构: { 结构: 'string' }, 条目上限: 6 },
  },
  {
    键: '命运点',
    名称: '命运点',
    摘要: '判定用的重掷与改判资源',
    字段: { 结构: 'number', 下限: 0, 上限: 999 },
  },
  {
    键: '终章',
    名称: '终章',
    摘要: '死亡回合的结算内容',
    字段: {
      结构: 'object',
      子字段: {
        已结算: { 结构: 'boolean' },
        享年: { 结构: 'number', 下限: 0, 上限: 150 },
        死因: { 结构: 'string', 长文本: true },
        一生总结: { 结构: 'string', 长文本: true },
        巅峰: { 结构: 'string', 长文本: true },
        墓志铭: { 结构: 'string', 长文本: true },
        评语: { 结构: 'string', 长文本: true },
      },
    },
  },
  {
    键: '$参数',
    名称: '参数',
    标注: '脚本维护，慎改',
    摘要: '渲染进条目的数值参数，随回合更新',
    默认折叠: true,
    字段: {
      结构: 'object',
      子字段: {
        事件数量: { 结构: 'number', 下限: 1, 上限: 20 },
        事件细节上限: { 结构: 'number', 下限: 0, 上限: 100000, 说明: '细节段落的字数上限' },
        事件配额: {
          结构: 'array',
          值结构: { 结构: 'string' },
          说明: '本回合各条事件的来源标签，顺序即派生顺序',
        },
        机会条数: { 结构: 'number', 下限: 0, 上限: 20, 说明: '事件数量之外额外派生的机会事件条数' },
        上回合配额领域: { 结构: 'array', 值结构: { 结构: 'string' }, 说明: '供本回合的加权分配降权' },
        修正表: {
          结构: 'object',
          说明: '判定用的分项修正表',
          子字段: {
            先天: { 结构: 'object', 动态: true, 值结构: { 结构: 'number', 下限: -30, 上限: 40 } },
            层级: { 结构: 'object', 动态: true, 值结构: { 结构: 'number', 下限: 0, 上限: 27 } },
            份额: { 结构: 'object', 动态: true, 值结构: { 结构: 'number', 下限: 0, 上限: 20 } },
            目标值: { 结构: 'object', 动态: true, 值结构: { 结构: 'number', 下限: 0, 上限: 100 } },
            界线: { 结构: 'object', 动态: true, 值结构: { 结构: 'number', 下限: 1, 上限: 5 } },
          },
        },
        判定骰: {
          结构: 'array',
          说明: '本回合可用的骰值，按顺序取用',
          值结构: { 结构: 'number', 下限: 1, 上限: 100 },
        },
        判定清单: {
          结构: 'array',
          说明: '本回合每条判定的定位与骰值',
          值结构: {
            结构: 'object',
            子字段: {
              事件: { 结构: 'string' },
              选项: { 结构: 'string' },
              行动原文: { 结构: 'string', 长文本: true },
              骰值: { 结构: 'number', 下限: 0, 上限: 100 },
              命运点: { 结构: 'enum', 枚举: ['', '重掷', '加值', '改判'] },
            },
          },
        },
        手写判定: {
          结构: 'array',
          说明: '选项为「其他」的手写行动的标注与算出的数值',
          值结构: {
            结构: 'object',
            子字段: {
              事件: { 结构: 'string' },
              难度: { 结构: 'enum', 枚举: 难度档 },
              取项: { 结构: 'enum', 枚举: 先天项 },
              主项: { 结构: 'string' },
              领域: { 结构: 'string' },
              修正: { 结构: 'number', 下限: -30, 上限: 90 },
              成功线: { 结构: 'number', 下限: 0, 上限: 100 },
            },
          },
        },
        本次判定: {
          结构: 'array',
          说明: '本回合每条判定的复核结果，界面直接读',
          值结构: {
            结构: 'object',
            子字段: {
              事件: { 结构: 'string' },
              选项: { 结构: 'string' },
              骰值: { 结构: 'number', 下限: 0, 上限: 100 },
              难度: { 结构: 'enum', 枚举: 难度档 },
              目标: { 结构: 'number', 下限: 0, 上限: 100 },
              界线: { 结构: 'number', 下限: 1, 上限: 5 },
              修正: { 结构: 'number', 下限: -30, 上限: 90 },
              成功线: { 结构: 'number', 下限: 0, 上限: 100 },
              结果: { 结构: 'enum', 枚举: ['大失败', '失败', '成功', '大成功'] },
              命运点: { 结构: 'enum', 枚举: ['', '重掷', '加值', '改判'] },
              复核: { 结构: 'string', 说明: '空字符串表示模型所写与复算结果一致' },
            },
          },
        },
      },
    },
  },
];

const store = useDataStore();

const 当前键 = ref(分组列表[0].键);

const 当前 = computed(() => 分组列表.find(组 => 组.键 === 当前键.value) ?? 分组列表[0]);

const 当前值 = computed(() => (store.data as unknown as Record<string, any>)[当前键.value]);

/** 把控件回传的值写回变量，深度监听会随即同步到 stat_data */
function 写回(载荷: { 路径: string; 值: any }) {
  _.set(store.data, 载荷.路径.split('.'), 载荷.值);
}
</script>

<template>
  <div class="ls-var">
    <nav class="ls-var-nav" aria-label="变量分组">
      <button
        v-for="组 in 分组列表"
        :key="组.键"
        class="ls-var-tab"
        :class="{ 'ls-is-active': 当前键 === 组.键 }"
        type="button"
        @click="当前键 = 组.键"
      >
        <span class="ls-var-tab-name">{{ 组.名称 }}</span>
        <span v-if="组.标注" class="ls-var-tab-tag">{{ 组.标注 }}</span>
      </button>
    </nav>

    <section class="ls-var-main">
      <header class="ls-var-head">
        <h2 class="ls-var-title">{{ 当前.名称 }}</h2>
        <p v-if="当前.摘要" class="ls-var-note">{{ 当前.摘要 }}</p>
      </header>

      <div :key="当前.键" class="ls-var-body">
        <FieldControl
          v-bind="当前.字段"
          :路径="当前.键"
          :值="当前值"
          :标签="当前.名称"
          :默认折叠="!!当前.默认折叠"
          @update="写回"
        />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.ls-var {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  width: 100%;
  box-sizing: border-box;
}

.ls-var-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  background: var(--ls-surface);
}

.ls-var-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
  border: none;
  border-radius: var(--ls-r-sm);
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 12.5px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-var-tab:hover {
    background: var(--ls-surface-hover);
    color: var(--ls-text);
  }
}

.ls-var-tab.ls-is-active {
  background: var(--ls-accent-soft);
  color: var(--ls-accent-hover);
}

.ls-var-tab-name {
  min-width: 0;
}

.ls-var-tab-tag {
  margin-left: auto;
  flex: none;
  color: var(--ls-caution);
  font-size: 10.5px;
  font-weight: 400;
  white-space: nowrap;
}

.ls-var-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  background: var(--ls-surface);
  overflow: hidden;
}

.ls-var-head {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 13px 16px 11px;
  border-bottom: 1px solid var(--ls-border);
}

.ls-var-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-text);
}

.ls-var-note {
  font-size: 11.5px;
  color: var(--ls-text-faint);
  line-height: 1.5;
}

.ls-var-body {
  padding: 10px 16px 16px;
  animation: ls-reveal 0.3s var(--ls-ease-out) both;
}

@media (max-width: 1023px) {
  .ls-var {
    grid-template-columns: minmax(0, 1fr);
  }

  .ls-var-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 5px;
  }

  .ls-var-tab {
    flex: none;
  }
}
</style>
