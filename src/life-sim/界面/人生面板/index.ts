import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import { 恢复全屏 } from './全屏';
import './global.css';

/**
 * 等 MVU 就绪。
 *
 * `waitGlobalInitialized('Mvu')` 先看本窗口有没有 `Mvu`，没有就只等一次
 * `global_Mvu_initialized` 事件、不做轮询。页面重载时楼层 iframe 先建好、MVU 后初始化，
 * 事件早已发过，只等事件会永久挂起；而 MVU 与楼层 iframe 不在同一个窗口里，
 * 本窗口也拿不到它。所以两条路一起走：一条等事件，一条在本窗口与顶层窗口之间轮询，
 * 谁先成谁算数。
 */
async function 等Mvu() {
  const 轮询 = (async () => {
    for (let 次 = 0; 次 < 600; 次++) {
      const 顶层 = (() => {
        try {
          return window.top as unknown as Record<string, unknown> | null;
        } catch {
          // 跨域时取 window.top 的属性会抛错，按拿不到处理
          return null;
        }
      })();
      const 本窗口 = window as unknown as Record<string, unknown>;
      const 取到 = (本窗口.Mvu ?? 顶层?.Mvu) as { getMvuData?: unknown } | undefined;
      if (取到 && typeof 取到.getMvuData === 'function') {
        // 写回本窗口：后续的 waitGlobalInitialized 与各模块都从 window.Mvu 取
        本窗口.Mvu = 取到;
        return;
      }
      await new Promise(解决 => setTimeout(解决, 100));
    }
    throw new Error('等待 MVU 就绪超时');
  })();

  await Promise.race([waitGlobalInitialized('Mvu'), 轮询]);
}

async function 初始化() {
  await 等Mvu();
  await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));

  // 界面被酒馆助手重建时全屏会跟着丢，挂载之前先按宿主上的标记恢复
  恢复全屏();

  // pinia 由模板的 externals 规则指向 CDN（skill 的 tavern-helper-template §11.1）
  createApp(App).use(createPinia()).mount('#ls-app');
}

$(() => {
  errorCatched(初始化)();
});
