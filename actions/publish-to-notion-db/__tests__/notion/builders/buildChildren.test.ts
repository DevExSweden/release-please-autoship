import { describe, it, expect } from 'vitest';
import buildChildren from '../../../src/notion/builders/children';

describe('buildChildren', () => {
  it('returns empty array for empty body', () => {
    expect(buildChildren('', 'paragraph')).toEqual([]);
  });

  it('builds paragraph block', () => {
    const res = buildChildren('Hello', 'paragraph');
    expect(res[0]?.type).toBe('paragraph');
  });

  it('builds markdown code block', () => {
    const res = buildChildren('# Title', 'markdown_code');
    expect(res[0]?.type).toBe('code');
    expect(res[0]?.code?.language).toBe('markdown');
  });

  it('falls back to paragraph and warns on unknown type', () => {
    const warnings: string[] = [];
    const logger = { warning: (msg: string) => warnings.push(msg) };
    const res = buildChildren('Body', 'unknown', logger);
    expect(warnings.length).toBe(1);
    expect(res[0]?.type).toBe('paragraph');
  });
});


