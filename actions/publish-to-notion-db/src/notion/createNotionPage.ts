import { NotionClientLike } from '../core/types';

const NOTION_CHILDREN_BATCH_LIMIT = 100;

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
    children: firstBatch
  });

  if (Array.isArray(children) && children.length > NOTION_CHILDREN_BATCH_LIMIT) {
    for (let i = NOTION_CHILDREN_BATCH_LIMIT; i < children.length; i += NOTION_CHILDREN_BATCH_LIMIT) {
      const batch = children.slice(i, i + NOTION_CHILDREN_BATCH_LIMIT);
      if (notionClient.blocks?.children?.append) {
        await notionClient.blocks.children.append({
          block_id: page.id,
          children: batch
        });
      }
    }
  }

  return page;
}


