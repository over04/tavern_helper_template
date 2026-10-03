import { computed } from 'vue';
import VerdictBar from '../人生面板/components/判定条.vue';
import { 读楼层, 楼层上下文键, 变量版本 } from '../人生面板/正文';
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

    // 等本楼层的变量就绪。必须带显式楼层号：不传时 getVariables 取的是最新一条非系统楼层，
    // 与被渲染的楼层不是同一层——生成新楼层后最新一层的 stat_data 还没写入，这里会一直等到超时。
    // 超时也照常挂载：判定条读到空快照时自行不渲染，比整块挂不上去可查。
    await 等到(() => _.has(getVariables({ type: 'message', message_id: 楼层号 }), 'stat_data'), 5000);

    const 楼层 = computed(() => 读楼层(楼层号, 1)[0] ?? null);

    // 判定条只读注入进来的楼层快照，不用 pinia，也就不必为它创建一个空的 pinia 实例
    const 应用 = createApp(VerdictBar, { 序号: 位置 + 1 });
    应用.provide(楼层上下文键, { 楼层, 变量版本 });
    应用.mount(挂载点);
  }

  $(() => {
    errorCatched(初始化)();
  });
}
