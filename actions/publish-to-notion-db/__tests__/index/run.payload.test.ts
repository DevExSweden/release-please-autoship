import { describe, it, expect } from 'vitest';
import { main } from '../../src/index';
import { CoreLike, NotionClientLike } from '../../src/core/types';

type CoreWithLogs = CoreLike & {
  infos: string[];
  warnings: string[];
  failures: string[];
};

function makeCore(inputs: Record<string, string>): CoreWithLogs {
  return {
    getInput(name: string): string {
      return inputs[name] ?? '';
    },
    info(message: string) {
      this.infos.push(message);
    },
    warning(message: string) {
      this.warnings.push(message);
    },
    setFailed(message: string) {
      this.failures.push(message);
    },
    infos: [],
    warnings: [],
    failures: []
  } as CoreWithLogs;
}

class CapturingNotion implements NotionClientLike {
  lastArgs: any | null = null;
  pages = {
    create: async (args: any) => {
      (this as any).lastArgs = args;
      return { id: 'page_456' };
    }
  };
}

const baseInputs = {
  notion_token: 'secret',
  notion_database_id: 'db456',
  title_property_name: 'Name',
  title: 'My Title',
  properties_json: ''
};

describe('run payload behaviors', () => {
  it('sends correct parent and properties, no children if empty body', async () => {
    const core = makeCore({ ...baseInputs, body: '', body_type: 'paragraph' });
    const notion = new CapturingNotion();
    await main(core, (function (this: any, args: any) {
      return Object.assign(notion, args);
    } as unknown) as any);

    expect(notion.lastArgs.parent).toEqual({ database_id: 'db456' });
    expect(notion.lastArgs.properties.Name).toBeDefined();
    expect(Array.isArray(notion.lastArgs.children)).toBe(true);
    expect(notion.lastArgs.children.length).toBe(0);
  });

  it('falls back to paragraph and warns on unknown body_type', async () => {
    const core = makeCore({ ...baseInputs, body: 'Body', body_type: 'unknown' });
    const notion = new CapturingNotion();
    await main(core, (function (this: any, args: any) {
      return Object.assign(notion, args);
    } as unknown) as any);

    expect(core.warnings.length).toBe(1);
    expect(notion.lastArgs.children?.[0]?.type).toBe('paragraph');
  });
});


