/** Escape text embedded in Telegram HTML parse_mode messages. */
export function escapeTelegramHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Bold label for Telegram HTML messages (content is escaped). */
export function boldHtml(text: string): string {
  return `<b>${escapeTelegramHtml(text)}</b>`;
}
