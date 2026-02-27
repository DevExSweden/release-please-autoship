export const MAX_RICH_TEXT_LENGTH = 2000;

export function chunkText(input: string, size: number = MAX_RICH_TEXT_LENGTH): string[] {
  if (!input) return [''];
  const chunks: string[] = [];
  let index = 0;
  while (index < input.length) {
    chunks.push(input.slice(index, index + size));
    index += size;
  }
  return chunks;
}

/**
 * Split any individual rich_text entries whose text.content exceeds 2000 chars
 * into multiple entries. Works for both block-level rich_text arrays and
 * table_row cell arrays.
 */
export function chunkRichTextArray(richText: any[]): any[] {
  const result: any[] = [];
  for (const entry of richText) {
    const content = entry?.text?.content;
    if (typeof content === 'string' && content.length > MAX_RICH_TEXT_LENGTH) {
      for (const chunk of chunkText(content)) {
        result.push({ ...entry, text: { ...entry.text, content: chunk } });
      }
    } else {
      result.push(entry);
    }
  }
  return result;
}

