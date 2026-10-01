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
          <span class="ls-tpl-desc">{{ substituteUser(tpl.form.bg) }}</span>
          <span class="ls-tpl-cast">
            <span v-for="person in tpl.cast" :key="person" class="ls-tpl-person">{{ person }}</span>
          </span>
        </button>
      </template>

      <template v-else-if="page === 'custom'">
        <label class="ls-field">
          <span class="ls-field-label">背景设定</span>
          <textarea v-model="form.bg" class="ls-field-area" rows="3" />
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
      </template>
    </div>

    <footer class="ls-opening-foot">
      <button class="ls-begin" type="button" @click="begin">以此生开始</button>
      <p v-if="hint" class="ls-opening-hint">{{ hint }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { injectInput } from '../inject';
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
      bg: '父亲陈建国在轴承厂做车工，母亲周敏在巷口经营一间小卖部，外婆王彩凤从绍兴赶来照看月子。家里只有一套两室一厅的老公房，存款三万元出头，{{user}}是家中的第一个孩子。',
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
      bg: '父亲林守拙在镇中学做民办教师，母亲王秀兰在供销社当营业员，外公王德厚在十里外的村子里种田。家里住镇上的教工宿舍，存款不过八百元，{{user}}是家中的第一个孩子。',
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
      bg: '父亲裴远山经营城南的一间绸缎庄，母亲沈静姝主持中馈，上头有长兄裴铭和次兄裴钰，另有奶娘周嬷嬷照看起居。家中有三进宅院，在行市里数得上名号，{{user}}是家中的第三个孩子。',
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

const RANDOM_POOL = [
  { yy: 1986, mm: 6, place: '北方小城的国营机床厂家属院', fam: '父亲在机床厂做工人，母亲在纺织厂上三班，一家三口挤在厂里分的一间筒子楼里。', wealth: '一般' },
  { yy: 1994, mm: 3, place: '江南县城的老城街巷', fam: '父亲开一间杂货铺，母亲在街道办上班，外婆同住，日常起居都有人照应。', wealth: '小康' },
  { yy: 2003, mm: 9, place: '省会城市城郊的老居民区', fam: '父亲跑出租车，母亲在医院做保洁，一家住老小区一套两室一厅。', wealth: '一般' },
  { yy: 1929, mm: 4, place: '沪上石库门弄堂', fam: '父亲在洋行做账房先生，母亲在家操持，祖母同住，一家靠一份薪水过活。', wealth: '小康' },
  { yy: 1017, mm: 2, place: '架空王朝大衍的京城', fam: '父亲经营绸缎庄，母亲主持中馈，长兄在书院读书，家中上下十几口人。', wealth: '殷实' },
];

// 模板简介里的 {{user}} 需要自己替换：界面内的文本不经过酒馆的宏处理
const userName = ref('');

onMounted(() => {
  try {
    const name = globalThis.SillyTavern?.substituteParams?.('{{user}}');
    if (typeof name === 'string' && name && name !== '{{user}}') {
      userName.value = name;
    }
  } catch {
    userName.value = '';
  }
});

// 模板简介与填入表单的背景设定同源，只在这里做一次 {{user}} 替换
function substituteUser(text: string): string {
  return text.replace(/\{\{user\}\}/g, () => userName.value || '你');
}

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

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function useTemplate(tpl: Template) {
  Object.assign(form, tpl.form);
  form.bg = substituteUser(form.bg);
  page.value = 'custom';
}

function rollRandom() {
  const base = pick(RANDOM_POOL);
  const sex: Sex = Math.random() < 0.5 ? '男' : '女';
  Object.assign(form, {
    yy: base.yy,
    mm: base.mm,
    dd: 1,
    sex,
    span: pick([3, 6, 12]),
    iq: 45 + Math.floor(Math.random() * 31),
    eq: 45 + Math.floor(Math.random() * 31),
    phy: 45 + Math.floor(Math.random() * 31),
    look: 45 + Math.floor(Math.random() * 31),
    will: 45 + Math.floor(Math.random() * 31),
    luck: 45 + Math.floor(Math.random() * 31),
    bg: `家在${base.place}。${base.fam}日子过得${base.wealth}。`,
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
  store.data.状态.健康 = 60;
  store.data.状态.气度 = 0;
  store.data.状态.声望 = 0;
  store.data.状态.幸福 = 0;
}

function begin() {
  const error = validate();
  if (error) {
    hint.value = error;
    return;
  }
  hint.value = '';

  writeVariables();

  const intro =
    form.bg.trim() || `${form.yy}年${form.mm}月${form.dd}日 生，${form.sex}。出身与家庭背景按该年代常识补全。`;
  injectInput(`【开局】设定如下：补全档案，随后开始这段人生。\n\n${intro}`);
}
</script>

<style lang="scss" scoped>
.ls-opening {
  display: flex;
  flex-direction: column;
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

.ls-opening-tab:hover {
  color: var(--ls-text);
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

.ls-tpl:hover {
  background: var(--ls-surface-sunken);
  border-color: var(--ls-border-strong);
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

.ls-sex:hover {
  background: var(--ls-surface-sunken);
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
  flex: 1;
  min-width: 0;
  height: 4px;
  appearance: none;
  border-radius: 999px;
  background: var(--ls-border-strong);
  outline: none;
  cursor: pointer;
}

.ls-trait-range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ls-accent);
  border: 2px solid var(--ls-surface);
  box-shadow: var(--ls-shadow-hair);
}

.ls-trait-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ls-accent);
  border: 2px solid var(--ls-surface);
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

.ls-random:hover {
  border-color: var(--ls-accent);
  background: var(--ls-accent-soft);
  color: var(--ls-accent-hover);
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

.ls-begin:not(:disabled):hover {
  background: var(--ls-accent-hover);
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
