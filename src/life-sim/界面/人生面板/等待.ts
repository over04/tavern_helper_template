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

/** 本窗口或顶层窗口里的 MVU；两处都没有时返回 null */
const 取Mvu = (): { getMvuData?: unknown } | null => {
  const 本窗口 = (globalThis as { Mvu?: { getMvuData?: unknown } }).Mvu;
  if (本窗口?.getMvuData) {
    return 本窗口;
  }
  try {
    const 顶层 = (window.top as unknown as { Mvu?: { getMvuData?: unknown } } | null)?.Mvu;
    return 顶层?.getMvuData ? 顶层 : null;
  } catch {
    // 跨域时取 window.top 的属性会抛错，按拿不到处理
    return null;
  }
};

/**
 * 等 MVU 就绪，取到之后写回本窗口。
 *
 * `waitGlobalInitialized('Mvu')` 先看本窗口有没有 `Mvu`，没有就只等一次
 * `global_Mvu_initialized` 事件、不做轮询。页面重载时楼层 iframe 先建好、MVU 后初始化，
 * 事件早已发过，只等事件会永久挂起；而 MVU 与楼层 iframe 不在同一个窗口里，
 * 本窗口也拿不到它。所以两条路一起走：一条等事件，一条在两处窗口之间轮询，谁先成谁算数。
 */
export async function 等Mvu(时限 = 60000): Promise<void> {
  await Promise.race([waitGlobalInitialized('Mvu'), 等到(() => Boolean(取Mvu()), 时限)]);

  const Mvu = 取Mvu();
  if (!Mvu) {
    throw new Error('等待 MVU 就绪超时');
  }
  (globalThis as { Mvu?: unknown }).Mvu = Mvu;
}
