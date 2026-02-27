import { chunkRichTextArray } from '../utils/richText';

const RICH_TEXT_BLOCK_TYPES = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'quote',
  'callout',
  'toggle',
  'to_do',
  'code'
];

/**
 * Recursively sanitize a block so that no rich_text entry exceeds 2000 chars.
 * Handles:
 *  - All standard block types with a top-level rich_text array
 *  - table_row cells (each cell is an array of rich_text items)
 *  - table blocks (recurses into their children rows)
 */
export function sanitizeBlock(block: any): any {
  const blockType = block?.type;
  if (!blockType) return block;

  if (RICH_TEXT_BLOCK_TYPES.includes(blockType)) {
    const section = block[blockType];
    if (section?.rich_text && Array.isArray(section.rich_text)) {
      return {
        ...block,
        [blockType]: { ...section, rich_text: chunkRichTextArray(section.rich_text) }
      };
    }
    return block;
  }

  if (blockType === 'table_row') {
    const cells = block.table_row?.cells;
    if (Array.isArray(cells)) {
      return {
        ...block,
        table_row: {
          ...block.table_row,
          cells: cells.map((cell: any[]) => (Array.isArray(cell) ? chunkRichTextArray(cell) : cell))
        }
      };
    }
    return block;
  }

  if (blockType === 'table') {
    const tableChildren = block.table?.children;
    if (Array.isArray(tableChildren)) {
      return {
        ...block,
        table: {
          ...block.table,
          children: tableChildren.map(sanitizeBlock)
        }
      };
    }
    return block;
  }

  return block;
}

