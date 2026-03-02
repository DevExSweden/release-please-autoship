import { NotionClientLike } from '../core/types';

const NOTION_CHILDREN_BATCH_LIMIT = 100;

/**
 * Notion's blocks.children.append API does not support nested `children`
 * inside table blocks — the table rows are silently dropped.
 * After appending a batch that contains table blocks, we must append the
 * table rows to each table block separately using its block ID.
 *
 * @param originalBatch  - the blocks as originally constructed (with table.children)
 * @param appendedBlocks - the blocks returned by Notion after the append (with IDs, no nested children)
 */
async function appendTableRows(
  notionClient: NotionClientLike,
  originalBatch: any[],
  appendedBlocks: any[]
): Promise<void> {
  if (!notionClient.blocks?.children?.append) return;

  for (let i = 0; i < originalBatch.length; i++) {
    const original = originalBatch[i];
    if (
      original?.type === 'table' &&
      Array.isArray(original?.table?.children) &&
      original.table.children.length > 0
    ) {
      const createdBlock = appendedBlocks[i];
      const blockId = createdBlock?.id;
      if (blockId) {
        await notionClient.blocks.children.append({
          block_id: blockId,
          children: original.table.children
        });
      }
    }
  }
}

/**
 * Strip nested `children` from table blocks before sending them in a
 * blocks.children.append call. The rows will be appended separately
 * after the API returns the created block IDs.
 */
function stripTableChildren(blocks: any[]): any[] {
  return blocks.map((block) => {
    if (block?.type === 'table' && Array.isArray(block?.table?.children)) {
      const { children: _rows, ...tableWithoutChildren } = block.table;
      return { ...block, table: tableWithoutChildren };
    }
    return block;
  });
}

export default async function createNotionPage(
  notionClient: NotionClientLike,
  databaseId: string,
  properties: any,
  children: any[]
) {
  const firstBatch = Array.isArray(children) ? children.slice(0, NOTION_CHILDREN_BATCH_LIMIT) : [];
  const page = await notionClient.pages.create({
    parent: { database_id: databaseId },
    properties,
    // Notion supports nested children for table blocks in pages.create
    children: firstBatch
  });

  if (Array.isArray(children) && children.length > NOTION_CHILDREN_BATCH_LIMIT) {
    for (let i = NOTION_CHILDREN_BATCH_LIMIT; i < children.length; i += NOTION_CHILDREN_BATCH_LIMIT) {
      const batch = children.slice(i, i + NOTION_CHILDREN_BATCH_LIMIT);
      if (notionClient.blocks?.children?.append) {
        const result = await notionClient.blocks.children.append({
          block_id: page.id,
          children: stripTableChildren(batch)
        });
        // Append table rows separately for each table block in this batch
        const appendedBlocks: any[] = result?.results ?? [];
        await appendTableRows(notionClient, batch, appendedBlocks);
      }
    }
  }

  return page;
}


