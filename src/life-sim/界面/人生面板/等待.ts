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
 * 两处窗口已有 Mvu 时直接取用，不走 `waitGlobalInitialized`：它在本窗口没有 `Mvu` 时
 * 会挂一个一次性监听器，而重载页面时 MVU 的初始化事件早已发过、`Mvu` 又在顶层窗口上，
 * 这个监听器永远不会被触发，也就永远留在那里——每个楼层 iframe 各留一个。
 *
 * 两处都没有时才两条路一起走：一条等事件，一条在两个窗口之间轮询，谁先成谁算数。
 */
export async function 等Mvu(时限 = 60000): Promise<void> {
  if (!取Mvu()) {
    await Promise.race([waitGlobalInitialized('Mvu'), 等到(() => Boolean(取Mvu()), 时限)]);
  }

  const Mvu = 取Mvu();
  if (!Mvu) {
    throw new Error('等待 MVU 就绪超时');
  }
  (globalThis as { Mvu?: unknown }).Mvu = Mvu;
}
