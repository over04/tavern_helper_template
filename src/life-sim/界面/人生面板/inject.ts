/**
 * 把文本写进酒馆输入框，交由玩家手动发送。
 *
 * 界面运行在消息楼层 iframe 中，与主文档同源，所以优先直接操作主文档的输入框：
 * `/setinput` 是 Slash 命令，参数以行尾为界，容纳不了多行正文，只作回退。
 */
function getInput(): HTMLTextAreaElement | null {
  try {
    return window.parent?.document?.querySelector<HTMLTextAreaElement>('#send_textarea') ?? null;
  } catch {
    return null;
  }
}

function fallback(text: string) {
  // Slash 参数不能含换行，回退路径只能压缩为单行
  const single = text.replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|');
  triggerSlash(`/setinput ${single}`).catch(error => console.error('写入输入框失败', error));
}

/** 覆盖输入框内容。 */
export function injectInput(text: string) {
  const input = getInput();
  if (!input) {
    fallback(text);
    return;
  }
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** 追加到输入框末尾，已有内容时以换行分隔。 */
export function appendInput(text: string) {
  const current = getInput()?.value ?? '';
  const merged = current.trim() ? `${current.replace(/\s+$/, '')}\n${text}` : text;
  injectInput(merged);
}

/**
 * 把输入框中的 from 片段原地替换为 to。
 *
 * 取不到输入框、或输入框里已经没有 from 时返回 false，由调用方决定改成追加：
 * 这两种情况都说明界面记的「上一次注入」已经不在输入框里了。
 */
export function replaceInput(from: string, to: string): boolean {
  const input = getInput();
  if (!input || !from || !input.value.includes(from)) {
    return false;
  }
  input.value = input.value.replace(from, to);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}
