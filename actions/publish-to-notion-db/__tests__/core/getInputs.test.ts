import getInputs from '../../src/core/getInputs';
import { CoreLike } from '../../src/core/types';
import { describe, it, expect } from "vitest";

function makeCore(inputs: Record<string, string>): CoreLike {
  return {
    getInput(name: string): string {
      return inputs[name] ?? '';
    },
    info() {},
    warning() {},
    setFailed() {}
  };
}

describe('getInputs', () => {
  const required = {
    notion_token: 'secret',
    notion_database_id: 'db123',
    title_property_name: 'Name',
    title: 'My Title'
  };

  it('applies defaults for optional values', () => {
    const core = makeCore(required);
    const res = getInputs(core);
    expect(res.body).toBe('');
    expect(res.bodyType).toBe('notion_blocks_json');
    expect(res.properties).toEqual({});
  });

  it('parses valid properties_json', () => {
    const core = makeCore({
      ...required,
      properties_json: '{"Status":{"select":{"name":"Done"}}}'
    });
    const res = getInputs(core);
    expect(res.properties).toEqual({ Status: { select: { name: 'Done' } } });
  });
});


