import { computed } from 'vue';
import VerdictBar from '../人生面板/components/判定条.vue';
import { 读楼层, 楼层上下文键, 变量版本 } from '../人生面板/正文';
import { 等到, 等变量就绪 } from '../人生面板/等待';
import '../人生面板/global.css';

// 正则只定位：加载器把捕获组拿到的序号写在 window.__ls判定序号 上，界面据此取对应的那一条。
// 判定标签是 XML 标签，序号属于定位信息，与「前端界面的正则只定位、不解析」那条规则一致。
// 渲染复用全屏界面的同一份判定条组件，两处读同一份 $参数.本次判定，结果一致。
const 挂载点 = document.querySelector<HTMLElement>('.ls-judge-root');

if (挂载点) {
  // 标签里的序号从 1 开始，数组下标从 0 开始；取不到有效数字时按第 1 条处理
  const 序号 = Number((globalThis as { __ls判定序号?: unknown }).__ls判定序号);
  const 位置 = Number.isFinite(序号) && 序号 >= 1 ? 序号 - 1 : 0;

  $(async () => {
    // 与人生面板同理：楼层 iframe 可能先于 MVU 建好，那时事件已经发过，
    // waitGlobalInitialized 会一直挂着，改从顶层窗口取那一份
    const 取Mvu = () => {
      const 自己 = (globalThis as { Mvu?: { getMvuData?: unknown } }).Mvu;
      if (自己?.getMvuData) {
        return 自己;
      }
      try {
        const 顶层 = (window.top as unknown as { Mvu?: { getMvuData?: unknown } } | null)?.Mvu;
        return 顶层?.getMvuData ? 顶层 : null;
      } catch {
        return null;
      }
    };
    const Mvu就绪 = await 等到(() => Boolean(取Mvu()), 20000);
    const Mvu = 取Mvu();
    if (!Mvu就绪 || !Mvu) {
      return;
    }
    (globalThis as { Mvu?: unknown }).Mvu = Mvu;

    await 等变量就绪();

    // 楼层内没有正文区的楼层条，判定条据此定位自己所在的那一层
    const 楼层号 = getCurrentMessageId();
    const 楼层 = computed(() => 读楼层(楼层号, 1)[0] ?? null);

    // 判定条只读注入进来的楼层快照，不用 pinia，也就不必为它创建一个空的 pinia 实例
    const 应用 = createApp(VerdictBar, { 序号: 位置 + 1 });
    应用.provide(楼层上下文键, { 楼层, 变量版本 });
    应用.mount(挂载点);
  });
}
