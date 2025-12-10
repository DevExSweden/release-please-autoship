import { CoreLike, Inputs } from './types';

export default function getInputs(core: CoreLike): Inputs {
  const notionToken = core.getInput('notion_token', { required: true });
  const databaseId = core.getInput('notion_database_id', { required: true });

  const titlePropertyName = core.getInput('title_property_name', { required: true });
  const title = core.getInput('title', { required: true });

  const propertiesJson = core.getInput('properties_json') || '';
  const body = core.getInput('body') || '';
  const bodyType = core.getInput('body_type') || 'notion_blocks_json';

  let properties: Record<string, unknown> = {};
  if (propertiesJson.trim().length > 0) {
    try {
      properties = JSON.parse(propertiesJson);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse properties_json: ${message}`);
    }
  }

  return {
    notionToken,
    databaseId,
    titlePropertyName,
    title,
    properties,
    body,
    bodyType
  };
}


