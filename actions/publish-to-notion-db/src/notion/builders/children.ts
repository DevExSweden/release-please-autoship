type LoggerLike = {
  warning?: (message: string) => void;
};

const MAX_RICH_TEXT_LENGTH = 2000;

function chunkText(input: string, size: number = MAX_RICH_TEXT_LENGTH): string[] {
  console.log('chunkText', input, size);
  if (!input) return [''];
  const chunks: string[] = [];
  let index = 0;
  while (index < input.length) {
    chunks.push(input.slice(index, index + size));
    index += size;
  }
  return chunks;
}

export default function buildChildren(
  body: string,
  bodyType: string,
  logger?: LoggerLike
): any[] {
  const trimmed = (body || '').trim();
  if (trimmed.length === 0) return [];

  if (bodyType === 'notion_blocks_json') {
    try {
      return JSON.parse(body);
    } catch (e) {
      logger?.warning?.(`Failed to parse notion_blocks_json body: ${(e as Error).message}`);
      return [];
    }
  }

  if (bodyType === 'paragraph') {
    const richText = chunkText(body).map((content) => ({
      type: 'text',
      text: { content }
    }));
    return [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: richText
        }
      }
    ];
  }

  if (bodyType === 'markdown_code') {
    const richText = chunkText(body).map((content) => ({
      type: 'text',
      text: { content }
    }));

    return [
      {
        object: 'block',
        type: 'code',
        code: {
          language: 'markdown',
          rich_text: richText
        }
      }
    ];
  }

  // fallback
  logger?.warning?.(`Unknown body_type '${bodyType}', falling back to paragraph.`);

  const fallbackRichText = chunkText(body).map((content) => ({
    type: 'text',
    text: { content }
  }));

  return [
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: fallbackRichText
      }
    }
  ];
}
