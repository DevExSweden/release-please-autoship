type LoggerLike = {
  warning?: (message: string) => void;
};

import { chunkText } from '../utils/richText';
import { sanitizeBlock, splitTableIfNeeded } from './sanitizeBlocks';

export default function buildChildren(
  body: string,
  bodyType: string,
  logger?: LoggerLike
): any[] {
  const trimmed = (body || '').trim();
  if (trimmed.length === 0) return [];

  if (bodyType === 'notion_blocks_json') {
    try {
      const blocks = JSON.parse(body);
      if (!Array.isArray(blocks)) return blocks;
      return blocks.map(sanitizeBlock).flatMap(splitTableIfNeeded);
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
