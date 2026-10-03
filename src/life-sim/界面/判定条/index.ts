import { computed } from 'vue';
import VerdictBar from '../人生面板/components/判定条.vue';
import { 读楼层, 楼层上下文键 } from '../人生面板/正文';
import { 等Mvu, 等到 } from '../人生面板/等待';
import '../人生面板/global.css';

// 正则只定位：加载器把捕获组拿到的序号写在 window.__ls判定序号 上，界面据此取对应的那一条。
// 判定标签是 XML 标签，序号属于定位信息，与「前端界面的正则只定位、不解析」那条规则一致。
// 渲染用的是人生面板里的同一份判定条组件，读同一份 $参数.本次判定。
const 挂载点 = document.querySelector<HTMLElement>('.ls-judge-root');

if (挂载点) {
  // 标签里的序号从 1 开始，数组下标从 0 开始；取不到有效数字时按第 1 条处理
  const 序号 = Number((globalThis as { __ls判定序号?: unknown }).__ls判定序号);
  const 位置 = Number.isFinite(序号) && 序号 >= 1 ? 序号 - 1 : 0;

  async function 初始化() {
    await 等Mvu();

    // 楼层内没有正文区的楼层条，判定条据此定位自己所在的那一层
    const 楼层号 = getCurrentMessageId();

    // 等本楼层的判定复核完成。必须带显式楼层号：不传时 getVariables 取的是最新一条非系统楼层，
    // 与被渲染的楼层不是同一层——生成新楼层后最新一层的 stat_data 还没写入，这里会一直等到超时。
    //
    // 判据是「本次判定 与 判定清单 长度相等」，不是「字段存在」。initvar 给 本次判定 设了空数组初值，
    // 该初值会落进楼层变量，所以等字段存在从楼层变量落盘那一刻起就恒为真，等于没等；判定条只取一次数，
    // 读到空数组后整块不渲染，于是永远空白。
    //
    // 本次判定 由 判定复核 脚本在 VARIABLE_UPDATE_ENDED 时写入，长度恒等于它读到的 判定清单 的长度，
    // 所以两者长度相等就表示复核已经跑完。本回合确实没有判定时两个长度都是 0，条件立即成立，不会白等。
    //
    // 已知误判边界：上一回合留下的 本次判定 与本周期的 判定清单 长度恰好相同（含两者都是 0）时，
    // 条件在复核写入之前就已经成立，会提前挂载。这种情况读到的是上一回合的判定数据，显示上与本回合
    // 无判定难以区分，需要时按判定条的空态诊断提示回看变量。
    //
    // 超时也照常挂载：判定条会显示一行诊断提示，比整块界面空白可查。
    await 等到(() => {
      const 变量 = getVariables({ type: 'message', message_id: 楼层号 });
      const 清单 = _.get(变量, 'stat_data.$参数.判定清单');
      const 本次 = _.get(变量, 'stat_data.$参数.本次判定');
      if (!Array.isArray(清单) || !Array.isArray(本次)) {
        return false;
      }
      return 本次.length === 清单.length;
    }, 5000);

    const 楼层 = computed(() => 读楼层(楼层号, 1)[0] ?? null);

    // 判定条只读注入进来的楼层快照，不用 pinia，也就不必为它创建一个空的 pinia 实例
    const 应用 = createApp(VerdictBar, { 序号: 位置 + 1 });
    应用.provide(楼层上下文键, { 楼层 });
    应用.mount(挂载点);
  }

  $(() => {
    errorCatched(初始化)();
  });
}
