/**
 * 轮询等待条件成立。时限为 0 时不限时，只在条件成立时结束。
 *
 * 不引入第三方包：界面产物一旦依赖 CDN 上的模块，CDN 不通时整个 ES 模块都不会执行，
 * 楼层里只剩一片空白，连错误提示都写不出来。
 */
export function 等到(条件: () => boolean, 时限 = 0): Promise<boolean> {
  return new Promise(解决 => {
    const 起点 = Date.now();
    const 试 = () => {
      let 成立: boolean;
      try {
        成立 = 条件();
      } catch {
        成立 = false;
      }
      if (成立) {
        解决(true);
        return;
      }
      if (时限 > 0 && Date.now() - 起点 >= 时限) {
        解决(false);
        return;
      }
      setTimeout(试, 100);
    };
    试();
  });
}

/** 等本楼变量就绪。时限为 0 时不限时 */
export function 等变量就绪(时限 = 0): Promise<boolean> {
  return 等到(() => _.has(getVariables({ type: 'message' }), 'stat_data'), 时限);
}
