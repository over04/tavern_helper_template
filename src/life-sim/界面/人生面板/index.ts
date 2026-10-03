import App from './App.vue';
import { 取本楼层号 } from './常驻';
import { 等Mvu, 等到 } from './等待';
import './global.css';

async function 初始化() {
  await 等Mvu();

  // 等本楼层的变量就绪。必须带显式楼层号：不传时 getVariables 取的是最新一条非系统楼层，
  // 与被渲染的楼层不是同一层——生成新楼层后最新一层的 stat_data 还没写入，这里会一直等到超时。
  // 超时也照常挂载：App.vue 的异常分支会把原因显示出来，比整块界面空白可查。
  // 时限允许被预览桩改小：预览要覆盖「等满时限再挂载」这条路径，真等满 5 秒会让每次回归都拖长。
  const 时限 = Number((window as unknown as { __ls变量等待时限?: number }).__ls变量等待时限) || 5000;
  await 等到(() => _.has(getVariables({ type: 'message', message_id: 取本楼层号() }), 'stat_data'), 时限);

  // pinia 由模板的 externals 规则指向 CDN（skill 的 tavern-helper-template §11.1）
  createApp(App).use(createPinia()).mount('#ls-app');
}

$(() => {
  errorCatched(初始化)();
});
