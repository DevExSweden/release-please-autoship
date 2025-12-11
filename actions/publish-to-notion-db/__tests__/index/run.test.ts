import { describe, it, expect } from 'vitest';
import { main } from '../../src/index';
import { CoreLike, NotionClientLike } from '../../src/core/types';

function makeCore(inputs: Record<string, string>): CoreLike & {
  infos: string[];
  warnings: string[];
  failures: string[];
} {
  return {
    getInput(name: string): string {
      return inputs[name] ?? '';
    },
    info(message: string) {
      (this as any).infos.push(message);
    },
    warning(message: string) {
      (this as any).warnings.push(message);
    },
    setFailed(message: string) {
      (this as any).failures.push(message);
    },
    infos: [],
    warnings: [],
    failures: []
  } as any;
}

class FakeNotion implements NotionClientLike {
  pages = {
    create: async (_args: any) => {
      return { id: 'page_123' };
    }
  };
}

describe('run', () => {
  const baseInputs = {
    notion_token: 'secret',
    notion_database_id: 'db123',
    title_property_name: 'Name',
    title: 'My Title',
    properties_json: '',
    body: 'Hello',
    body_type: 'paragraph'
  };

  it('creates a page and logs id', async () => {
    const core = makeCore(baseInputs);
    await main(core, FakeNotion as any);
    expect(core.failures.length).toBe(0);
    expect(core.infos.some((i: string) => i.includes('page_123'))).toBe(true);
  });

  it('handles invalid properties_json', async () => {
    const core = makeCore({ ...baseInputs, properties_json: '{bad json' });
    await main(core, FakeNotion as any);
    expect(core.failures.length).toBe(1);
    expect(core.infos.length).toBe(0);
  });
});



