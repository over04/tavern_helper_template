/**
 * 把文本写进酒馆输入框，交由玩家手动发送。
 *
 * 界面运行在消息楼层 iframe 中，与主文档同源，所以优先直接操作主文档的输入框：
 * `/setinput` 是 Slash 命令，参数以行尾为界，承载不了多行正文，只作兜底。
 */
function getInput(): HTMLTextAreaElement | null {
  try {
    return window.parent?.document?.querySelector<HTMLTextAreaElement>('#send_textarea') ?? null;
  } catch {
    return null;
  }
}

function fallback(text: string) {
  // Slash 参数不能含换行，兜底路径只能压成单行
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
