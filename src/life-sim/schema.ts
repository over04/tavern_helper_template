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

  // _先天：六维天赋，出生即定终身不变，AI 可见不可改
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

  // 状态：健康为生命值，0 死亡；气度不占份额
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

  // 学识：动态键为学科名，层级制成长
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
        })
        .prefault({}),
    )
    .prefault({}),

  // 技能：动态键为技能名，与学识同构
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

  // 事件：动态键为事件名，选项为动态键 一~四
  事件: z
    .record(
      z.string().describe('事件名'),
      z
        .object({
          细节: z.string().prefault('待初始化'),
          截止: z.string().prefault('待初始化'),
          主题: z.string().prefault('待初始化'),
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

  // $参数：渲染进条目的字数参数，AI 不可见不可改
  $参数: z
    .object({
      正文下限: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100000))
        .prefault(1500),
      正文上限: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100000))
        .prefault(3000),
      事件细节下限: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100000))
        .prefault(40),
      事件细节上限: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100000))
        .prefault(80),
      终章总结下限: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100000))
        .prefault(150),
      终章总结上限: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100000))
        .prefault(300),
    })
    .prefault({}),
});

export type Schema = z.output<typeof Schema>;
