import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import '../人生面板/global.css';

// 正则把正文里每个 <判定:N/> 换成一份同样的片段，并把标签里的序号用捕获组写进 data-位置。
// 判定标签是 XML 标签，序号由正则捕获组写进片段的 data-位置，界面据此取对应的那一条；
// 这与「前端界面的正则只定位、不解析」那条 MVU 规则无关，详见 design-spec 的判定条一节。
const 挂载点 = document.querySelector<HTMLElement>('.ls-judge-root');

if (挂载点) {
  // 标签里的序号从 1 开始，数组下标从 0 开始；取不到有效数字时按第 1 条处理
  const 序号 = Number(挂载点.dataset.位置);
  const 位置 = Number.isFinite(序号) && 序号 >= 1 ? 序号 - 1 : 0;

  $(async () => {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));
    createApp(App, { 位置 }).use(createPinia()).mount(挂载点);
  });
}
