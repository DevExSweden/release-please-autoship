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

  it('chunks oversized rich_text in notion_blocks_json blocks', () => {
    const longContent = 'a'.repeat(4500);
    const blocks = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: longContent } }]
        }
      }
    ];
    const res = buildChildren(JSON.stringify(blocks), 'notion_blocks_json');
    const richText = res[0].paragraph.rich_text;
    expect(richText.length).toBe(3);
    expect(richText[0].text.content.length).toBe(2000);
    expect(richText[1].text.content.length).toBe(2000);
    expect(richText[2].text.content.length).toBe(500);
  });

  it('leaves short rich_text in notion_blocks_json untouched', () => {
    const blocks = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: 'short' } }]
        }
      }
    ];
    const res = buildChildren(JSON.stringify(blocks), 'notion_blocks_json');
    expect(res[0].paragraph.rich_text.length).toBe(1);
    expect(res[0].paragraph.rich_text[0].text.content).toBe('short');
  });

  it('chunks oversized rich_text inside a code block', () => {
    const longCode = 'x'.repeat(3000);
    const blocks = [
      {
        object: 'block',
        type: 'code',
        code: {
          language: 'ts',
          rich_text: [{ type: 'text', text: { content: longCode } }]
        }
      }
    ];
    const res = buildChildren(JSON.stringify(blocks), 'notion_blocks_json');
    const richText = res[0].code.rich_text;
    expect(richText.length).toBe(2);
    expect(richText[0].text.content.length).toBe(2000);
    expect(richText[1].text.content.length).toBe(1000);
  });

  it('chunks oversized content in table_row cells', () => {
    const longCell = 'c'.repeat(2500);
    const blocks = [
      {
        object: 'block',
        type: 'table_row',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: longCell } }],
            [{ type: 'text', text: { content: 'short' } }]
          ]
        }
      }
    ];
    const res = buildChildren(JSON.stringify(blocks), 'notion_blocks_json');
    const cells = res[0].table_row.cells;
    expect(cells[0].length).toBe(2);
    expect(cells[0][0].text.content.length).toBe(2000);
    expect(cells[0][1].text.content.length).toBe(500);
    expect(cells[1].length).toBe(1);
  });

  it('sanitizes table_row cells nested inside a table block', () => {
    const longCell = 'd'.repeat(2100);
    const blocks = [
      {
        object: 'block',
        type: 'table',
        table: {
          table_width: 1,
          has_column_header: true,
          has_row_header: false,
          children: [
            {
              object: 'block',
              type: 'table_row',
              table_row: {
                cells: [[{ type: 'text', text: { content: longCell } }]]
              }
            }
          ]
        }
      }
    ];
    const res = buildChildren(JSON.stringify(blocks), 'notion_blocks_json');
    const cells = res[0].table.children[0].table_row.cells;
    expect(cells[0].length).toBe(2);
    expect(cells[0][0].text.content.length).toBe(2000);
    expect(cells[0][1].text.content.length).toBe(100);
  });
});


