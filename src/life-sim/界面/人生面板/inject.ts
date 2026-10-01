/**
 * 把一条指令写进酒馆输入框，交由玩家手动发送。
 *
 * 界面运行在消息楼层 iframe 中，`/setinput` 由酒馆在处理命令时定位主文档的输入框并写入。
 * `|` 是 Slash 命令的管道分隔符，转义成 `\|` 后作为字面量传入。
 */
export function injectInput(text: string) {
  triggerSlash(`/setinput ${text.replace(/\|/g, '\\|')}`).catch(error => console.error('写入输入框失败', error));
}
