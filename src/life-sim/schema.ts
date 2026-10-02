export const Schema = z.object({
  // 时间：回合推进与年龄读数
  时间: z
    .object({
      回合: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 9999))
        .prefault(0),
      年: z.coerce
        .number()
        .transform((v) => _.clamp(v, 1, 9999))
        .prefault(1),
      月: z.coerce
        .number()
        .transform((v) => _.clamp(v, 1, 12))
        .prefault(1),
      跨度: z.coerce
        .number()
        .transform((v) => _.clamp(v, 1, 60))
        .prefault(1),
      // 模式：月推进 / 分钟推进，玩家在正文里用自然语言切换，开局固定为月推进
      模式: z.enum(['月推进', '分钟推进']).prefault('月推进'),
      // 日：0 表示时间未具体到日，首次进入分钟推进时以当前读数的当月月末 23:59 为起点；1~31 为真实日；月推进回合冻结保留
      日: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 31))
        .prefault(0),
      // 时：分钟推进的进位单位，月推进回合冻结保留
      时: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 23))
        .prefault(0),
      // 分：分钟推进的最小单位，满 60 进位到 时，月推进回合冻结保留
      分: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 59))
        .prefault(0),
      // 慢速累计：本段分钟推进期间累计流逝的分钟数，由脚本按 日/时/分 的实际推进自动维护；退出回合按 T/43200 月折算补结算，结算后清零
      慢速累计: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 999999))
        .prefault(0),
      年龄岁: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 150))
        .prefault(0),
      年龄月: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 11))
        .prefault(0),
      阶段: z
        .enum([
          '新生儿',
          '幼年',
          '童年',
          '少年',
          '青年',
          '成年',
          '中年',
          '壮年',
          '老年',
          '暮年',
        ])
        .prefault('新生儿'),
    })
    .prefault({}),

  // _性别：出生即定，AI 可见不可改
  _性别: z.enum(['男', '女']).prefault('男'),

  // 姓名：玩家姓名，AI 可见可改（改名或用别名时更新）
  姓名: z.string().prefault(''),

  // _先天：六项天赋，出生即定终身不变，AI 可见不可改
  _先天: z
    .object({
      智商: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(50),
      情商: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(50),
      体质: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(50),
      颜值: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(50),
      意志: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(50),
      幸运: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(50),
    })
    .prefault({}),

  // 状态：健康为生命值，降为 0 即死亡；气度不占份额
  状态: z
    .object({
      健康: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(100),
      气度: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(50),
      声望: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(0),
      幸福: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(50),
    })
    .prefault({}),

  // 焦点：动态键为领域名，值为该领域本回合的精力份额
  焦点: z
    .record(
      z.string().describe('领域名'),
      z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 1.5)),
    )
    .prefault({}),

  // 学识：动态键为学科名，按层级成长
  学识: z
    .record(
      z.string().describe('学科名'),
      z
        .object({
          层级: z.coerce
            .number()
            .transform((v) => _.clamp(v, 0, 9))
            .prefault(0),
          进度: z.coerce
            .number()
            .transform((v) => _.clamp(v, 0, 100))
            .prefault(0),
          上限: z.coerce
            .number()
            .transform((v) => _.clamp(v, 0, 9))
            .prefault(0),
          类: z
            .enum([
              '数学',
              '语言',
              '自然科学',
              '工程技术',
              '医学',
              '人文',
              '社会科学',
              '艺术',
              '体育',
              '技艺',
            ])
            .prefault('技艺'),
          教育质量: z.coerce
            .number()
            .transform((v) => _.clamp(v, 0.5, 2))
            .prefault(1),
        })
        .prefault({}),
    )
    .prefault({}),

  // 技能：动态键为技能名，结构与学识相同
  技能: z
    .record(
      z.string().describe('技能名'),
      z
        .object({
          层级: z.coerce
            .number()
            .transform((v) => _.clamp(v, 0, 9))
            .prefault(0),
          进度: z.coerce
            .number()
            .transform((v) => _.clamp(v, 0, 100))
            .prefault(0),
          上限: z.coerce
            .number()
            .transform((v) => _.clamp(v, 0, 9))
            .prefault(0),
          类: z
            .enum([
              '数学',
              '语言',
              '自然科学',
              '工程技术',
              '医学',
              '人文',
              '社会科学',
              '艺术',
              '体育',
              '技艺',
            ])
            .prefault('技艺'),
          教育质量: z.coerce
            .number()
            .transform((v) => _.clamp(v, 0.5, 2))
            .prefault(1),
        })
        .prefault({}),
    )
    .prefault({}),

  // 关系：动态键为人物姓名
  关系: z
    .record(
      z.string().describe('人物姓名'),
      z
        .object({
          身份: z.string().prefault('待初始化'),
          阶段: z.string().prefault('待初始化'),
          亲密度: z.coerce
            .number()
            .transform((v) => _.clamp(v, -100, 100))
            .prefault(0),
        })
        .prefault({}),
    )
    .prefault({}),

  // 家庭资产：动态键为资产名
  家庭资产: z
    .record(
      z.string().describe('资产名'),
      z
        .object({
          数量: z.string().prefault('待初始化'),
          来源: z.string().prefault('待初始化'),
        })
        .prefault({}),
    )
    .prefault({}),

  // 个人资产：动态键为资产名
  个人资产: z
    .record(
      z.string().describe('资产名'),
      z
        .object({
          数量: z.string().prefault('待初始化'),
          来源: z.string().prefault('待初始化'),
        })
        .prefault({}),
    )
    .prefault({}),

  // 事件：动态键为事件名，整体指向下一回合跨度，选项为动态键 一~四
  事件: z
    .record(
      z.string().describe('事件名'),
      z
        .object({
          细节段落: z.string().prefault('待初始化'),
          发生时间: z.string().prefault('待初始化'),
          截止时间: z.string().prefault('待初始化'),
          所属主题: z.string().prefault('待初始化'),
          选项: z
            .record(
              z.string().describe('选项名'),
              z
                .object({
                  动作: z.string().prefault('待初始化'),
                  代价: z.string().prefault('待初始化'),
                })
                .prefault({}),
            )
            .prefault({}),
        })
        .prefault({}),
    )
    .prefault({}),

  // 心向：3~6 条方向，超出上限时保留最新的方向
  心向: z
    .array(z.string())
    .transform((v) => _.takeRight(v, 6))
    .prefault([]),

  // 终章：死亡回合的结算内容
  终章: z
    .object({
      已结算: z.boolean().prefault(false),
      享年: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 150))
        .prefault(0),
      死因: z.string().prefault('待初始化'),
      一生总结: z.string().prefault('待初始化'),
      巅峰: z.string().prefault('待初始化'),
      墓志铭: z.string().prefault('待初始化'),
      评语: z.string().prefault('待初始化'),
    })
    .prefault({}),

  // $参数：渲染进条目的数值参数，AI 不可见不可改
  $参数: z
    .object({
      事件数量: z.coerce
        .number()
        .transform((v) => _.clamp(v, 1, 20))
        .prefault(4),
      事件细节上限: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100000))
        .prefault(80),
    })
    .prefault({}),
});

export type Schema = z.output<typeof Schema>;
