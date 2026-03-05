import { chunkRichTextArray } from '../utils/richText';

/** Notion API limit: max 100 table_row children per table block */
const MAX_TABLE_CHILDREN = 100;

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

/**
 * If the block is a table with more than 100 children, return multiple table blocks
 * each with ≤100 children (header row repeated when has_column_header). Otherwise return [block].
 */
export function splitTableIfNeeded(block: any): any[] {
  if (block?.type !== 'table' || !Array.isArray(block.table?.children)) {
    return [block];
  }
  const children = block.table.children;
  if (children.length <= MAX_TABLE_CHILDREN) {
    return [block];
  }
  const hasColumnHeader = Boolean(block.table.has_column_header);
  const headerRow = hasColumnHeader ? children[0] : null;
  const dataRows = hasColumnHeader ? children.slice(1) : children;
  const maxDataPerTable = MAX_TABLE_CHILDREN - (headerRow ? 1 : 0);
  const result: any[] = [];
  for (let i = 0; i < dataRows.length; i += maxDataPerTable) {
    const chunk = dataRows.slice(i, i + maxDataPerTable);
    const rowsForTable = headerRow ? [headerRow, ...chunk] : chunk;
    result.push({
      ...block,
      table: {
        ...block.table,
        children: rowsForTable
      }
    });
  }
  return result;
}

