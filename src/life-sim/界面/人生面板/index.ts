import App from './App.vue';
import { 等到, 等变量就绪 } from './等待';
import './global.css';

/** 挂载失败时把原因写在宿主容器里：界面空白时，控制台之外也能看到线索 */
function 报告失败(原因: string) {
  const 宿主 = document.querySelector<HTMLElement>('#ls-app');
  if (!宿主) {
    return;
  }
  宿主.innerHTML = `<div style="padding:16px;font:13px/1.7 sans-serif;color:#b4472f">人生面板未能挂载：${原因}</div>`;
}

/** 酒馆助手会在 iframe 里预注入 jQuery；万一它没到位，退回 DOMContentLoaded，不让界面因此整个不挂载 */
function 就绪后(回调: () => void) {
  if (typeof $ === 'function') {
    $(回调);
    return;
  }
  console.warn('人生面板：jQuery 未就绪，改用 DOMContentLoaded');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', 回调, { once: true });
    return;
  }
  回调();
}

就绪后(async () => {
  const 宿主 = document.querySelector<HTMLElement>('#ls-app');
  if (!宿主) {
    return;
  }

  // 等待 MVU 就绪，8 秒为上限：超时后给出明确的提示
  const Mvu就绪 = await 等到(() => Boolean((window as any).Mvu?.getMvuData), 8000);
  if (!Mvu就绪) {
    报告失败('MVU 在 8 秒内没有就绪，请确认已安装酒馆助手与 MVU 脚本');
    return;
  }

  const 变量就绪 = await 等变量就绪(8000);
  if (!变量就绪) {
    // 变量没就绪也继续挂载：App 层的错误处理会把原因显示出来，比整块空白有用
    console.warn('人生面板：本楼变量在 8 秒内没有就绪，仍继续挂载');
  }

  try {
    // pinia 由模板的 externals 规则指向 CDN（skill 的 tavern-helper-template §11.1）
    createApp(App).use(createPinia()).mount(宿主);
  } catch (错误) {
    报告失败(String((错误 as Error)?.message ?? 错误));
  }
});
