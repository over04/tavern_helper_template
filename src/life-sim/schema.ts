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
        .prefault(2000),
      月: z.coerce
        .number()
        .transform((v) => _.clamp(v, 1, 12))
        .prefault(1),
      跨度: z.coerce
        .number()
        .transform((v) => _.clamp(v, 1, 60))
        .prefault(6),
      // 模式：月推进 / 分钟推进，玩家在正文里用自然语言切换，开局固定为月推进
      模式: z.enum(['月推进', '分钟推进']).prefault('月推进'),
      // 日：0 表示时间未具体到日，首次进入分钟推进时以当前读数的当月月末 23:59 为起点；1~31 为具体日期；月推进回合冻结保留
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
        .prefault(55),
      情商: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(55),
      体质: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(55),
      颜值: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(55),
      意志: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(55),
      幸运: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(55),
    })
    .prefault({}),

  // 状态：健康为生命值，降为 0 即死亡；气度不占份额
  状态: z
    .object({
      健康: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(60),
      气度: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(0),
      声望: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(0),
      幸福: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 100))
        .prefault(0),
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
                  // 难度：以同龄常人为参照，不随角色能力浮动；判定脚本据此给出目标难度
                  难度: z.enum(['轻松', '容易', '普通', '困难', '极难']).prefault('普通'),
                  // 取项：这项行动按性质取哪一项先天，判定脚本据此算先天修正
                  取项: z.enum(['智商', '情商', '体质', '颜值', '意志', '幸运']).prefault('智商'),
                  // 主项：这项行动对应的学识或技能条目名，生活领域留空，判定脚本据此取层级
                  主项: z.string().prefault(''),
                  // 领域：这项行动归属的领域名，取「焦点」里的键，判定脚本据此取份额
                  领域: z.string().prefault(''),
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

  // 命运点：判定用的重掷与改判资源；消耗由判定脚本在生成正文之前扣减
  命运点: z.coerce
    .number()
    .transform((v) => Math.max(0, Math.round(v)))
    .prefault(3),

  // 终章：死亡回合的结算内容
  终章: z
    .object({
      已结算: z.boolean().prefault(false),
      享年: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 150))
        .prefault(0),
      死因: z.string().prefault(''),
      一生总结: z.string().prefault(''),
      巅峰: z.string().prefault(''),
      墓志铭: z.string().prefault(''),
      评语: z.string().prefault(''),
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
      // 事件配额：本回合各条事件的来源标签（心向 / 领域名 / 天赋效应：某项先天 / 时代背景），顺序即派生顺序，由事件配额脚本写入
      事件配额: z
        .array(z.string())
        .prefault(['时代背景', '时代背景', '时代背景', '时代背景']),
      // 机会条数：在事件数量之外额外派生的机会事件条数，不占配额，由事件配额脚本写入
      机会条数: z.coerce
        .number()
        .transform((v) => _.clamp(v, 0, 20))
        .prefault(0),
      // 上回合配额领域：上一回合分配到的领域名，供本回合的加权分配降权
      上回合配额领域: z.array(z.string()).prefault([]),
      // 判定骰：本回合可用的骰值，由判定骰脚本在生成正文之前一次掷出，按顺序取用
      判定骰: z
        .array(
          z.coerce
            .number()
            .transform((v) => _.clamp(Math.round(v), 1, 100)),
        )
        .prefault([]),
      // 本次判定：玩家点选项时由判定骰脚本逐条写入，无选项触发时为空数组
      本次判定: z
        .array(
          z
            .object({
              事件: z.string().prefault(''),
              选项: z.coerce
                .number()
                .transform((v) => _.clamp(Math.round(v), 0, 4))
                .prefault(0),
              骰值: z.coerce
                .number()
                .transform((v) => _.clamp(Math.round(v), 0, 100))
                .prefault(0),
              难度: z.enum(['轻松', '容易', '普通', '困难', '极难']).prefault('普通'),
              // 目标：该难度对应的目标值，由脚本按难度表算好写入；注入与界面直接读，不再各自存一张表
              目标: z.coerce
                .number()
                .transform((v) => _.clamp(Math.round(v), 0, 100))
                .prefault(0),
              // 界线：两端区的分档 k，骰值 ≤ k 为大失败、≥ 101 − k 为大成功，同样由脚本算好写入
              界线: z.coerce
                .number()
                .transform((v) => _.clamp(Math.round(v), 0, 100))
                .prefault(0),
              // 修正：先天、主项层级、焦点份额三项之和，由脚本算并写入
              修正: z.coerce
                .number()
                .transform((v) => _.clamp(Math.round(v), -30, 90))
                .prefault(0),
              // 成功线：目标 − 修正，骰值 ≥ 成功线为成功；成败由界面据此判断，不存结果字段
              成功线: z.coerce
                .number()
                .transform((v) => _.clamp(Math.round(v), 0, 100))
                .prefault(0),
              命运点: z.enum(['', '重掷', '加值', '改判']).prefault(''),
            })
            .prefault({}),
        )
        .prefault([]),
    })
    .prefault({}),
});

export type Schema = z.output<typeof Schema>;
