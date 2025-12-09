import { describe, it, expect } from 'vitest';
import buildProperties from '../../../src/notion/builders/properties';

describe('buildProperties', () => {
  it('adds title property', () => {
    const props = buildProperties('Name', 'Release v1.2.3', {});
    expect(props['Name']).toEqual({
      title: [{ type: 'text', text: { content: 'Release v1.2.3' } }]
    });
  });

  it('merges extra properties', () => {
    const props = buildProperties('Name', 'Title', { Status: { select: { name: 'Done' } } });
    expect(props['Status']).toEqual({ select: { name: 'Done' } });
    expect(props['Name']).toBeDefined();
  });
});


