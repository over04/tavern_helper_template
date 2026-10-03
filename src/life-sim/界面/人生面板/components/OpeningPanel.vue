<template>
  <div class="ls-opening">
    <header class="ls-opening-head">
      <ClaudeMark :size="24" />
      <div class="ls-opening-titles">
        <h2 class="ls-opening-title">人生尚未开始</h2>
      </div>
    </header>

    <nav class="ls-opening-tabs">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="ls-opening-tab"
        :class="{ 'ls-is-active': page === tab.key }"
        type="button"
        @click="page = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="ls-opening-body">
      <template v-if="page === 'tpl'">
        <button v-for="tpl in TEMPLATES" :key="tpl.key" class="ls-tpl" type="button" @click="useTemplate(tpl)">
          <span class="ls-tpl-index">{{ tpl.index }}</span>
          <span class="ls-tpl-title">{{ tpl.title }}</span>
          <span class="ls-tpl-meta">{{ tpl.meta }}</span>
          <span class="ls-tpl-desc">{{ tpl.form.bg }}</span>
          <span class="ls-tpl-cast">
            <span v-for="person in tpl.cast" :key="person" class="ls-tpl-person">{{ person }}</span>
          </span>
        </button>
      </template>

      <template v-else-if="page === 'custom'">
        <label class="ls-field">
          <span class="ls-field-label">背景设定</span>
          <textarea
            v-model="form.bg"
            class="ls-field-area"
            rows="3"
            placeholder="留空则由模型按出生时间与年代常识补全"
          />
        </label>

        <div class="ls-field-grid">
          <label class="ls-field">
            <span class="ls-field-label">出生年</span>
            <input v-model.number="form.yy" class="ls-field-input" type="number" min="1" max="9999" />
          </label>
          <label class="ls-field">
            <span class="ls-field-label">出生月</span>
            <input v-model.number="form.mm" class="ls-field-input" type="number" min="1" max="12" />
          </label>
          <label class="ls-field">
            <span class="ls-field-label">出生日</span>
            <input v-model.number="form.dd" class="ls-field-input" type="number" min="1" max="31" />
          </label>
        </div>

        <div class="ls-field">
          <span class="ls-field-label">性别</span>
          <div class="ls-sex-row">
            <button
              v-for="option in SEXES"
              :key="option"
              class="ls-sex"
              :class="{ 'ls-is-active': form.sex === option }"
              type="button"
              @click="form.sex = option"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <div class="ls-field">
          <span class="ls-field-label">先天天赋</span>
          <div class="ls-trait-grid">
            <label v-for="trait in TRAITS" :key="trait.key" class="ls-trait">
              <span class="ls-trait-name">{{ trait.label }}</span>
              <input v-model.number="form[trait.key]" class="ls-trait-range" type="range" min="0" max="100" step="1" />
              <span class="ls-trait-value">{{ form[trait.key] }}</span>
            </label>
          </div>
        </div>

        <div class="ls-field">
          <span class="ls-field-label">跨度（月）</span>
          <div class="ls-trait">
            <input v-model.number="form.span" class="ls-trait-range" type="range" min="1" max="60" step="1" />
            <span class="ls-trait-value">{{ form.span }}</span>
          </div>
        </div>
      </template>

      <template v-else>
        <button class="ls-random" type="button" @click="rollRandom">
          <i class="fa-solid fa-shuffle" />
          <span>随机开局</span>
        </button>
        <p class="ls-random-hint">出生年月日、性别、跨度与六项天赋在表单允许的区间内随机。</p>
      </template>
    </div>

    <footer class="ls-opening-foot">
      <button class="ls-begin" type="button" @click="begin">以此生开始</button>
      <p v-if="hint" class="ls-opening-hint">{{ hint }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { 结算前确认 } from '../结算提醒';
import { use待发送 } from '../待发送';
import { useDataStore } from '../store';
import ClaudeMark from './ClaudeMark.vue';

type TraitKey = 'iq' | 'eq' | 'phy' | 'look' | 'will' | 'luck';
type Sex = '男' | '女';

interface Form {
  bg: string;
  yy: number;
  mm: number;
  dd: number;
  sex: Sex;
  iq: number;
  eq: number;
  phy: number;
  look: number;
  will: number;
  luck: number;
  span: number;
}

interface Template {
  key: string;
  index: string;
  title: string;
  meta: string;
  cast: string[];
  form: Omit<Form, 'dd'>;
}

const store = useDataStore();
const 待发送 = use待发送();

const TABS = [
  { key: 'tpl', label: '模板开局' },
  { key: 'custom', label: '自定义开局' },
  { key: 'rand', label: '随机开局' },
] as const;

const SEXES: Sex[] = ['男', '女'];

const TRAITS: { key: TraitKey; label: string }[] = [
  { key: 'iq', label: '智商' },
  { key: 'eq', label: '情商' },
  { key: 'phy', label: '体质' },
  { key: 'look', label: '颜值' },
  { key: 'will', label: '意志' },
  { key: 'luck', label: '幸运' },
];

const TEMPLATES: Template[] = [
  {
    key: 't1',
    index: '壹',
    title: '现代都市 · 2003',
    meta: '杭州 · 工薪家庭 · 每回合 6 个月',
    cast: ['陈建国 · 父亲', '周敏 · 母亲', '王彩凤 · 外婆'],
    form: {
      bg: '父亲陈建国在轴承厂做车工，母亲周敏在巷口经营一间小卖部，外婆王彩凤从绍兴赶来照看月子。家里只有一套两室一厅的老公房，存款三万元出头，家中的第一个孩子。',
      yy: 2003,
      mm: 9,
      sex: '女',
      span: 6,
      iq: 65,
      eq: 60,
      phy: 55,
      look: 60,
      will: 55,
      luck: 50,
    },
  },
  {
    key: 't2',
    index: '贰',
    title: '小镇一九八五',
    meta: '湘南青溪 · 教师家庭 · 每回合 6 个月',
    cast: ['林守拙 · 父亲', '王秀兰 · 母亲', '王德厚 · 外公'],
    form: {
      bg: '父亲林守拙在镇中学做民办教师，母亲王秀兰在供销社当营业员，外公王德厚在十里外的村子里种田。家里住镇上的教工宿舍，存款不过八百元，家中的第一个孩子。',
      yy: 1985,
      mm: 4,
      sex: '男',
      span: 6,
      iq: 71,
      eq: 62,
      phy: 60,
      look: 56,
      will: 62,
      luck: 55,
    },
  },
  {
    key: 't3',
    index: '叁',
    title: '架空古代 · 大衍',
    meta: '京城商户 · 每回合 6 个月',
    cast: ['裴远山 · 父亲', '沈静姝 · 母亲', '裴铭 · 长兄', '裴钰 · 次兄', '周嬷嬷 · 奶娘'],
    form: {
      bg: '父亲裴远山经营城南的一间绸缎庄，母亲沈静姝主持家务，上面还有长兄裴铭与次兄裴钰，另有奶娘周嬷嬷照看起居。家中有三进宅院，在同业中颇有声名，家中的第三个孩子。',
      yy: 1017,
      mm: 2,
      sex: '男',
      span: 6,
      iq: 64,
      eq: 65,
      phy: 55,
      look: 65,
      will: 52,
      luck: 52,
    },
  },
];

// 模板简介与填入表单的背景设定取自同一份文本
const page = ref<(typeof TABS)[number]['key']>('tpl');
const hint = ref('');

const form = reactive<Form>({
  bg: '',
  yy: 2000,
  mm: 1,
  dd: 1,
  sex: '男',
  iq: 55,
  eq: 55,
  phy: 55,
  look: 55,
  will: 55,
  luck: 55,
  span: 6,
});

/** 闭区间内的随机整数 */
function 取整(下限: number, 上限: number): number {
  return 下限 + Math.floor(Math.random() * (上限 - 下限 + 1));
}

function useTemplate(tpl: Template) {
  Object.assign(form, tpl.form);
  page.value = 'custom';
}

// 出生年月日、性别、跨度与六项天赋都在表单允许的区间内随机；
// 家庭背景、地点与谋生方式无法由脚本生成，留空交给模型按出生时间与年代常识补全
function rollRandom() {
  Object.assign(form, {
    yy: 取整(1, 9999),
    mm: 取整(1, 12),
    dd: 取整(1, 31),
    sex: Math.random() < 0.5 ? '男' : '女',
    span: 取整(1, 60),
    iq: 取整(0, 100),
    eq: 取整(0, 100),
    phy: 取整(0, 100),
    look: 取整(0, 100),
    will: 取整(0, 100),
    luck: 取整(0, 100),
    bg: '',
  });
  page.value = 'custom';
}

function validate(): string {
  if (!Number.isFinite(form.yy) || form.yy < 1 || form.yy > 9999) {
    return '出生年需在 1~9999 之间';
  }
  if (!Number.isFinite(form.mm) || form.mm < 1 || form.mm > 12) {
    return '出生月需在 1~12 之间';
  }
  if (!Number.isFinite(form.dd) || form.dd < 1 || form.dd > 31) {
    return '出生日需在 1~31 之间';
  }
  if (!Number.isFinite(form.span) || form.span < 1 || form.span > 60) {
    return '跨度需在 1~60 之间';
  }
  for (const trait of TRAITS) {
    const value = form[trait.key];
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return `天赋「${trait.label}」需在 0~100 之间`;
    }
  }
  return '';
}

// 事件数量按对数公式生成：L(s) = 1 + 3·log₆(s)、U(s) = 2 + 6·log₆(s)
// 与 脚本/事件数量随机.txt 同一公式；开局即写入具体值，避免首回合沿用 initvar 的占位值
function rollEventCount(span: number): number {
  const s = Math.max(1, Math.min(60, Number(span) || 1));
  const log6 = (value: number) => Math.log(value) / Math.log(6);
  const lower = Math.max(1, Math.round(1 + 3 * log6(s)));
  const upper = Math.max(lower, Math.round(2 + 6 * log6(s)));
  return lower + Math.floor(Math.random() * (upper - lower + 1));
}

// 开局只写玩家在面板上定下的值与由它派生的读数；状态四条（健康、气度、声望、幸福）
// 由 initvar 给初值，健康再由模型按开局背景核对，界面不在这里写一遍
function writeVariables() {
  store.data.时间.年 = form.yy;
  store.data.时间.月 = form.mm;
  store.data.时间.跨度 = form.span;
  store.data.时间.回合 = 0;
  store.data.时间.年龄岁 = 0;
  store.data.时间.年龄月 = 0;
  store.data.时间.阶段 = '新生儿';
  store.data._性别 = form.sex;
  store.data._先天.智商 = form.iq;
  store.data._先天.情商 = form.eq;
  store.data._先天.体质 = form.phy;
  store.data._先天.颜值 = form.look;
  store.data._先天.意志 = form.will;
  store.data._先天.幸运 = form.luck;
  store.data.$参数.事件数量 = rollEventCount(form.span);
}

/** 开局声明：出生、性别、跨度与六项天赋逐项列出；背景留空时标为随机，交给模型补全 */
function 拼开局声明(): string {
  const 段 = [
    '<开局>',
    `<出生 年="${form.yy}" 月="${form.mm}" 日="${form.dd}"/>`,
    `<性别>${form.sex}</性别>`,
    `<跨度>${form.span}</跨度>`,
    `<天赋 智商="${form.iq}" 情商="${form.eq}" 体质="${form.phy}" 颜值="${form.look}" 意志="${form.will}" 幸运="${form.luck}"/>`,
  ];
  const 背景 = form.bg.trim();
  段.push(背景 ? `<背景>${背景}</背景>` : '<背景 随机="true"/>');
  段.push('</开局>');
  return 段.join('\n');
}

async function begin() {
  const error = validate();
  if (error) {
    hint.value = error;
    return;
  }
  hint.value = '';

  writeVariables();
  待发送.设开局(拼开局声明());

  // 声明已由 待发送 写进酒馆输入框，玩家自己按发送；这里只提醒还没选选项的事件
  await 结算前确认(store.data.事件);
}
</script>

<style lang="scss" scoped>
@use '../滑块.scss' as 滑块;

.ls-opening {
  display: flex;
  flex-direction: column;
  /* 楼层 iframe 的 html/body 被酒馆助手注入 overflow:hidden!important，整页无法滚动，
     面板需自行承担滚动：这里限住高度，正文区域负责滚动 */
  flex: 1;
  min-height: 0;
  width: 100%;
  /* 开局时正文区独占整个宽列，面板限宽居中，列宽跟随设置里的阅读区上限 */
  max-width: var(--ls-read-width);
  margin: 0 auto;
  background: var(--ls-surface);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-md);
  overflow: hidden;
  animation: ls-enter 0.5s var(--ls-ease-out) both;
}

.ls-opening-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px 18px;
}

.ls-opening-title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--ls-text);
}

.ls-opening-tabs {
  display: flex;
  gap: 2px;
  margin: 0 16px;
  padding: 3px;
  border-radius: var(--ls-r-sm);
  background: var(--ls-bg-alt);
}

.ls-opening-tab {
  flex: 1;
  padding: 6px 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-opening-tab:hover {
    color: var(--ls-text);
  }
}

.ls-opening-tab.ls-is-active {
  background: var(--ls-surface);
  color: var(--ls-text);
  box-shadow: var(--ls-shadow-hair);
}

.ls-opening-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 滚动落在这一块：头部与底部按钮留在视野里，中间的开局模板自己滚 */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.ls-tpl {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 15px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  text-align: left;
  cursor: pointer;
  animation: ls-enter 0.42s var(--ls-ease-out) both;
}

.ls-tpl:nth-child(2) {
  animation-delay: 50ms;
}

.ls-tpl:nth-child(3) {
  animation-delay: 100ms;
}

@media (hover: hover) {
  .ls-tpl:hover {
    background: var(--ls-surface-sunken);
    border-color: var(--ls-border-strong);
  }
}

.ls-tpl-index {
  font-size: 11px;
  color: var(--ls-accent);
  letter-spacing: 0.2em;
}

.ls-tpl-title {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ls-text);
}

.ls-tpl-meta {
  font-size: 12px;
  color: var(--ls-text-faint);
}

.ls-tpl-desc {
  margin-top: 3px;
  font-family: var(--ls-f-serif);
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ls-text-body);
}

.ls-tpl-cast {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}

.ls-tpl-person {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--ls-bg-alt);
  font-size: 11px;
  color: var(--ls-text-muted);
}

.ls-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ls-field-label {
  font-size: 12px;
  color: var(--ls-text-muted);
}

.ls-field-area,
.ls-field-input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text);
  font-size: 13.5px;
  line-height: 1.6;
  outline: none;
  resize: vertical;
}

.ls-field-area::placeholder {
  color: var(--ls-text-faint);
}

.ls-field-area:focus,
.ls-field-input:focus {
  border-color: var(--ls-accent);
  box-shadow: 0 0 0 3px var(--ls-accent-soft);
}

.ls-field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ls-sex-row {
  display: flex;
  gap: 8px;
}

.ls-sex {
  flex: 1;
  padding: 8px 0;
  border: 1px solid var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface);
  color: var(--ls-text-body);
  font-size: 13.5px;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-sex:hover {
    background: var(--ls-surface-sunken);
  }
}

.ls-sex.ls-is-active {
  border-color: var(--ls-accent);
  background: var(--ls-accent-soft);
  color: var(--ls-accent-hover);
  font-weight: 500;
}

.ls-trait-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
  gap: 8px 18px;
}

.ls-trait {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ls-trait-name {
  flex: none;
  width: 32px;
  font-size: 12.5px;
  color: var(--ls-text-body);
}

.ls-trait-range {
  @include 滑块.滑块外观;
}

.ls-trait-value {
  flex: none;
  min-width: 28px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: var(--ls-text);
  font-variant-numeric: tabular-nums;
}

.ls-random {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 20px;
  border: 1px dashed var(--ls-border-strong);
  border-radius: var(--ls-r-sm);
  background: var(--ls-surface-sunken);
  color: var(--ls-text-body);
  font-size: 13.5px;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-random:hover {
    border-color: var(--ls-accent);
    background: var(--ls-accent-soft);
    color: var(--ls-accent-hover);
  }
}

.ls-random-hint {
  font-size: 12px;
  line-height: 1.7;
  color: var(--ls-text-faint);
}

.ls-opening-foot {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 0 16px 16px;
}

.ls-begin {
  padding: 11px 0;
  border: none;
  border-radius: var(--ls-r-sm);
  background: var(--ls-accent);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
}

@media (hover: hover) {
  .ls-begin:not(:disabled):hover {
    background: var(--ls-accent-hover);
  }
}

.ls-begin:disabled {
  background: var(--ls-border-strong);
  color: var(--ls-bg-alt);
  cursor: default;
}

.ls-opening-hint {
  min-height: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--ls-accent-hover);
}
</style>
