import * as core from '@actions/core';
import { Client } from '@notionhq/client';
import getInputs from './core/getInputs';
import buildProperties from './notion/builders/properties';
import buildChildren from './notion/builders/children';
import createNotionPage from './notion/createNotionPage';
import { CoreLike, NotionClientConstructor } from './core/types';

export async function main(coreLike: CoreLike, NotionClient: NotionClientConstructor) {
  try {
    const {
      notionToken,
      databaseId,
      titlePropertyName,
      title,
      properties,
      body,
      bodyType
    } = getInputs(coreLike);

    const notion = new NotionClient({ auth: notionToken });

    const pageProperties = buildProperties(titlePropertyName, title, properties);
    const children = buildChildren(body, bodyType, coreLike);

    const response = await createNotionPage(notion, databaseId, pageProperties, children);
    coreLike.info(`Created Notion page: ${response.id}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    coreLike.setFailed(message);
  }
}

if (require.main === module) {
  // Execute only when this module is the entrypoint (not during tests/imports)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  main(core as any, Client as any);
}


