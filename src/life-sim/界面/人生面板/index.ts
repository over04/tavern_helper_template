import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import { 恢复全屏 } from './全屏';
import { 等Mvu } from './等待';
import './global.css';

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
