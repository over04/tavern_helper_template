import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import { 恢复全屏 } from './全屏';
import './global.css';

/**
 * 等 MVU 就绪。
 *
 * `waitGlobalInitialized` 先看 `window.Mvu` 在不在，在就直接返回，不在就只等
 * `global_Mvu_initialized` 事件、不做轮询。重载页面时聊天先渲染、楼层 iframe 先建好，
 * MVU 那时还没就绪，事件也已经发过，于是这个 iframe 里永远等不到 Mvu——顶层窗口的 Mvu 则可正常取得。
 * 所以两条路一起等：本窗口或顶层窗口任一处拿到就算就绪。
 */
async function 等Mvu() {
  const 取 = () => {
    const 自己 = (window as { Mvu?: { getMvuData?: unknown } }).Mvu;
    if (自己?.getMvuData) {
      return 自己;
    }
    try {
      const 顶层 = (window.top as unknown as { Mvu?: { getMvuData?: unknown } } | null)?.Mvu;
      return 顶层?.getMvuData ? 顶层 : null;
    } catch {
      // 跨域时取不到顶层窗口，按没有处理
      return null;
    }
  };

  await Promise.race([
    waitGlobalInitialized('Mvu'),
    (async () => {
      while (!取()) {
        await new Promise(解决 => setTimeout(解决, 100));
      }
    })(),
  ]);

  const Mvu = 取();
  if (Mvu) {
    // 界面里各处按裸全局 Mvu 引用它，取到顶层那一份后写回本窗口
    (window as { Mvu?: unknown }).Mvu = Mvu;
  }
}

$(() => {
  errorCatched(async () => {
    await 等Mvu();
    await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));

    // 界面被酒馆助手重建时全屏会跟着丢，挂载之前先按宿主上的标记恢复
    恢复全屏();

    // pinia 由模板的 externals 规则指向 CDN（skill 的 tavern-helper-template §11.1）
    createApp(App).use(createPinia()).mount('#ls-app');
  })();
});
