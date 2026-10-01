<template>
  <div class="opening">
    <header class="opening-head">
      <ClaudeMark :size="24" />
      <div class="opening-titles">
        <h2 class="opening-title">人生尚未开始</h2>
        <p class="opening-sub">设定出身，或直接以文字报出设定</p>
      </div>
    </header>

    <nav class="opening-tabs">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="opening-tab"
        :class="{ 'is-active': page === tab.key }"
        type="button"
        @click="page = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="opening-body">
      <template v-if="page === 'tpl'">
        <button v-for="tpl in TEMPLATES" :key="tpl.key" class="tpl" type="button" @click="useTemplate(tpl)">
          <span class="tpl-index">{{ tpl.index }}</span>
          <span class="tpl-title">{{ tpl.title }}</span>
          <span class="tpl-meta">{{ tpl.meta }}</span>
          <span class="tpl-desc">{{ tpl.desc }}</span>
          <span class="tpl-cast">
            <span v-for="person in tpl.cast" :key="person" class="tpl-person">{{ person }}</span>
          </span>
        </button>
      </template>

      <template v-else-if="page === 'custom'">
        <label class="field">
          <span class="field-label">背景设定</span>
          <textarea
            v-model="form.bg"
            class="field-area"
            rows="3"
            placeholder="可留空，留空时由模型按年代补全"
          />
        </label>

        <div class="field-grid">
          <label class="field">
            <span class="field-label">出生年</span>
            <input v-model.number="form.yy" class="field-input" type="number" min="1" max="9999" />
          </label>
          <label class="field">
            <span class="field-label">出生月</span>
            <input v-model.number="form.mm" class="field-input" type="number" min="1" max="12" />
          </label>
          <label class="field">
            <span class="field-label">出生日</span>
            <input v-model.number="form.dd" class="field-input" type="number" min="1" max="31" />
          </label>
        </div>

        <div class="field">
          <span class="field-label">性别</span>
          <div class="sex-row">
            <button
              v-for="option in SEXES"
              :key="option"
              class="sex"
              :class="{ 'is-active': form.sex === option }"
              type="button"
              @click="form.sex = option"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <div class="field">
          <span class="field-label">先天天赋</span>
          <div class="trait-grid">
            <label v-for="trait in TRAITS" :key="trait.key" class="trait">
              <span class="trait-name">{{ trait.label }}</span>
              <input v-model.number="form[trait.key]" class="trait-range" type="range" min="0" max="100" step="1" />
              <span class="trait-value">{{ form[trait.key] }}</span>
            </label>
          </div>
        </div>

        <div class="field">
          <span class="field-label">跨度（月）</span>
          <div class="trait">
            <input v-model.number="form.span" class="trait-range" type="range" min="1" max="60" step="1" />
            <span class="trait-value">{{ form.span }}</span>
          </div>
        </div>
      </template>

      <template v-else>
        <button class="random" type="button" @click="rollRandom">
          <i class="fa-solid fa-shuffle" />
          <span>随机开局</span>
        </button>
      </template>
    </div>

    <footer class="opening-foot">
      <button class="begin" type="button" :disabled="submitted" @click="begin">
        {{ submitted ? '开局已提交' : '以此生开始' }}
      </button>
      <p v-if="hint" class="opening-hint">{{ hint }}</p>
      <p v-else class="opening-hint is-quiet">也可直接以文字报出出生年月日、性别、背景设定、跨度和先天天赋</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
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
  desc: string;
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
    desc: '父亲陈建国，轴承厂车工；母亲周敏，小卖部营业员；外婆王彩凤。存款约三万元，两室一厅老公房。主角陈念安，长女。',
    cast: ['陈建国 · 父亲', '周敏 · 母亲', '王彩凤 · 外婆'],
    form: {
      bg: '2003年9月，杭州。陈念安，女，新生儿。父亲陈建国，轴承厂车工；母亲周敏，小卖部营业员；外婆王彩凤，从绍兴来照顾月子。家境约三万元，两室一厅老公房。',
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
    desc: '父亲林守拙，民办教师；母亲王秀兰，供销社营业员；外公王德厚，务农。存款约八百元，一间镇教工宿舍。主角林向北，长子。',
    cast: ['林守拙 · 父亲', '王秀兰 · 母亲', '王德厚 · 外公'],
    form: {
      bg: '1985年4月，湘南小镇青溪。林向北，男，新生儿。父亲林守拙，镇中学民办教师；母亲王秀兰，供销社营业员；外公王德厚，十里外务农。家境约八百元，住一间镇教工宿舍，堂屋有一台红灯牌收音机。',
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
    desc: '父亲裴远山，绸缎庄东主；母亲沈静姝；长兄裴铭、次兄裴钰、奶娘周嬷嬷。一间绸缎庄，一座三进宅院。主角裴照，三公子。',
    cast: ['裴远山 · 父亲', '沈静姝 · 母亲', '裴铭 · 长兄', '裴钰 · 次兄', '周嬷嬷 · 奶娘'],
    form: {
      bg: '大衍历1017年2月，架空王朝大衍，京城。裴照，男，新生儿。父亲裴远山，绸缎庄东主；母亲沈静姝；长兄裴铭，七岁；次兄裴钰，四岁；奶娘周嬷嬷。家业：城南一间绸缎庄、一座三进宅院。',
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
  { yy: 1986, mm: 6, place: '北方小城国营厂家属院', fam: '父亲是国营机床厂工人，母亲在纺织厂做工；住厂里分的一间筒子楼。', wealth: '一般' },
  { yy: 1994, mm: 3, place: '江南县城老城街巷', fam: '父亲开一间杂货铺，母亲在街道办上班；外婆同住，照顾日常。', wealth: '小康' },
  { yy: 2003, mm: 9, place: '省会城市城郊居民区', fam: '父亲是出租车司机，母亲在医院做保洁；老小区两室一厅。', wealth: '一般' },
  { yy: 1929, mm: 4, place: '沪上石库门弄堂', fam: '父亲在洋行做账房先生，母亲在家操持；祖母同住。', wealth: '小康' },
  { yy: 1017, mm: 2, place: '架空王朝大衍京城', fam: '父亲经营绸缎庄，母亲主持中馈；长兄在书院读书。', wealth: '殷实' },
];

const RANDOM_NAMES = ['沈见山', '顾晚晴', '宋知许', '苏青梧', '江疏影', '萧映雪', '陆行舟', '温故'];

const page = ref<(typeof TABS)[number]['key']>('tpl');
const submitted = ref(false);
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
  page.value = 'custom';
}

function rollRandom() {
  const base = pick(RANDOM_POOL);
  const sex: Sex = Math.random() < 0.5 ? '男' : '女';
  const name = pick(RANDOM_NAMES);
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
    bg: `${base.yy}年${base.mm}月，${base.place}。${name}，${sex}，新生儿。${base.fam}家境：${base.wealth}。`,
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
  if (submitted.value) {
    hint.value = '开局已提交，人生开始。';
    return;
  }
  const error = validate();
  if (error) {
    hint.value = error;
    return;
  }

  writeVariables();
  submitted.value = true;
  hint.value = '开局已提交，人生开始。';

  const intro =
    form.bg.trim() || `${form.yy}年${form.mm}月${form.dd}日 生，${form.sex}。出身与家庭背景按该年代常识补全。`;
  const message = `【开局】设定如下：补全档案，随后开始这段人生。\n\n${intro}`;

  createChatMessages([{ role: 'user', message }])
    .then(() => triggerSlash('/trigger'))
    .catch(error => console.error('开局发送失败', error));
}
</script>

<style lang="scss" scoped>
.opening {
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  overflow: hidden;
  animation: cl-enter 0.5s var(--ease-out) both;
}

.opening-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px 18px;
}

.opening-title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--c-text);
}

.opening-sub {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--c-text-muted);
}

.opening-tabs {
  display: flex;
  gap: 2px;
  margin: 0 16px;
  padding: 3px;
  border-radius: var(--r-sm);
  background: var(--c-bg-alt);
}

.opening-tab {
  flex: 1;
  padding: 6px 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-text-muted);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
}

.opening-tab:hover {
  color: var(--c-text);
}

.opening-tab.is-active {
  background: var(--c-surface);
  color: var(--c-text);
  box-shadow: var(--shadow-hair);
}

.opening-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.tpl {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 15px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  background: var(--c-surface);
  text-align: left;
  cursor: pointer;
  animation: cl-enter 0.42s var(--ease-out) both;
}

.tpl:nth-child(2) {
  animation-delay: 50ms;
}

.tpl:nth-child(3) {
  animation-delay: 100ms;
}

.tpl:hover {
  background: var(--c-surface-sunken);
  border-color: var(--c-border-strong);
}

.tpl-index {
  font-size: 11px;
  color: var(--c-accent);
  letter-spacing: 0.2em;
}

.tpl-title {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--c-text);
}

.tpl-meta {
  font-size: 12px;
  color: var(--c-text-faint);
}

.tpl-desc {
  margin-top: 3px;
  font-family: var(--f-serif);
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--c-text-body);
}

.tpl-cast {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}

.tpl-person {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--c-bg-alt);
  font-size: 11px;
  color: var(--c-text-muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: var(--c-text-muted);
}

.field-area,
.field-input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-sm);
  background: var(--c-surface);
  color: var(--c-text);
  font-size: 13.5px;
  line-height: 1.6;
  outline: none;
  resize: vertical;
}

.field-area::placeholder {
  color: var(--c-text-faint);
}

.field-area:focus,
.field-input:focus {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px var(--c-accent-soft);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.sex-row {
  display: flex;
  gap: 8px;
}

.sex {
  flex: 1;
  padding: 8px 0;
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-sm);
  background: var(--c-surface);
  color: var(--c-text-body);
  font-size: 13.5px;
  cursor: pointer;
}

.sex:hover {
  background: var(--c-surface-sunken);
}

.sex.is-active {
  border-color: var(--c-accent);
  background: var(--c-accent-soft);
  color: var(--c-accent-hover);
  font-weight: 500;
}

.trait-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
  gap: 8px 18px;
}

.trait {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trait-name {
  flex: none;
  width: 32px;
  font-size: 12.5px;
  color: var(--c-text-body);
}

.trait-range {
  flex: 1;
  min-width: 0;
  height: 4px;
  appearance: none;
  border-radius: 999px;
  background: var(--c-border-strong);
  outline: none;
  cursor: pointer;
}

.trait-range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--c-accent);
  border: 2px solid var(--c-surface);
  box-shadow: var(--shadow-hair);
}

.trait-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--c-accent);
  border: 2px solid var(--c-surface);
}

.trait-value {
  flex: none;
  min-width: 28px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}

.random {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 20px;
  border: 1px dashed var(--c-border-strong);
  border-radius: var(--r-sm);
  background: var(--c-surface-sunken);
  color: var(--c-text-body);
  font-size: 13.5px;
  cursor: pointer;
}

.random:hover {
  border-color: var(--c-accent);
  background: var(--c-accent-soft);
  color: var(--c-accent-hover);
}

.opening-foot {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 0 16px 16px;
}

.begin {
  padding: 11px 0;
  border: none;
  border-radius: var(--r-sm);
  background: var(--c-accent);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
}

.begin:not(:disabled):hover {
  background: var(--c-accent-hover);
}

.begin:disabled {
  background: var(--c-border-strong);
  color: var(--c-bg-alt);
  cursor: default;
}

.opening-hint {
  min-height: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--c-accent-hover);
}

.opening-hint.is-quiet {
  color: var(--c-text-faint);
}
</style>
