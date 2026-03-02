import { describe, it, expect } from 'vitest';
import createNotionPage from '../../src/notion/createNotionPage';
import type { NotionClientLike } from '../../src/core/types';

function makeChildren(count: number) {
	const arr = [];
	for (let i = 0; i < count; i++) {
		arr.push({ type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `#${i}` } }] } });
	}
	return arr;
}

describe('createNotionPage batching', () => {
	it('sends all children when <= 100 and does not append', async () => {
		let createdArgs: any | null = null;
		let appendCalls: Array<any> = [];

		const client: NotionClientLike = {
			pages: {
				create: async (args: any) => {
					createdArgs = args;
					return { id: 'page_1' };
				},
			},
			blocks: {
				children: {
					append: async (args: any) => {
						appendCalls.push(args);
						return {};
					},
				},
			},
		};

		const children = makeChildren(50);
		await createNotionPage(client, 'db1', { Name: {} }, children);

		expect(createdArgs?.children?.length).toBe(50);
		expect(appendCalls.length).toBe(0);
	});

	it('splits children into 100 + remainder and appends remainder', async () => {
		let createdArgs: any | null = null;
		let appendCalls: Array<any> = [];

		const client: NotionClientLike = {
			pages: {
				create: async (args: any) => {
					createdArgs = args;
					return { id: 'page_2' };
				},
			},
			blocks: {
				children: {
					append: async (args: any) => {
						appendCalls.push(args);
						return {};
					},
				},
			},
		};

		const children = makeChildren(151);
		await createNotionPage(client, 'db2', { Name: {} }, children);

		expect(createdArgs?.children?.length).toBe(100);
		expect(appendCalls.length).toBe(1);
		expect(appendCalls[0]?.block_id).toBe('page_2');
		expect(appendCalls[0]?.children?.length).toBe(51);
	});

	it('passes table with rows inline when it is in the first batch (pages.create)', async () => {
		let createdArgs: any | null = null;
		const appendCalls: Array<any> = [];

		const client: NotionClientLike = {
			pages: {
				create: async (args: any) => {
					createdArgs = args;
					return { id: 'page_3' };
				},
			},
			blocks: {
				children: {
					append: async (args: any) => {
						appendCalls.push(args);
						return { results: [] };
					},
				},
			},
		};

		const tableRows = [
			{ object: 'block', type: 'table_row', table_row: { cells: [[{ type: 'text', text: { content: 'Header' } }]] } },
			{ object: 'block', type: 'table_row', table_row: { cells: [[{ type: 'text', text: { content: 'Value' } }]] } },
		];
		const tableBlock = {
			object: 'block',
			type: 'table',
			table: { table_width: 1, has_column_header: true, has_row_header: false, children: tableRows }
		};

		await createNotionPage(client, 'db3', { Name: {} }, [tableBlock]);

		// Table rows should be present in the pages.create call (Notion supports nested children here)
		expect(createdArgs?.children?.[0]?.table?.children).toHaveLength(2);
		// No extra append call needed for first-batch tables
		expect(appendCalls.length).toBe(0);
	});

	it('strips table rows from overflow batch append and re-appends them to the table block', async () => {
		let createdArgs: any | null = null;
		const appendCalls: Array<any> = [];

		// Simulate Notion returning the created blocks with IDs
		const client: NotionClientLike = {
			pages: {
				create: async (args: any) => {
					createdArgs = args;
					return { id: 'page_4' };
				},
			},
			blocks: {
				children: {
					append: async (args: any) => {
						appendCalls.push(args);
						// Simulate Notion returning the table block with an id
						const returnedBlocks = (args.children ?? []).map((b: any, idx: number) => ({
							...b,
							id: `block_${idx}`
						}));
						return { results: returnedBlocks };
					},
				},
			},
		};

		const tableRows = [
			{ object: 'block', type: 'table_row', table_row: { cells: [[{ type: 'text', text: { content: 'Col1' } }]] } },
		];
		const tableBlock = {
			object: 'block',
			type: 'table',
			table: { table_width: 1, has_column_header: true, has_row_header: false, children: tableRows }
		};

		// Put 100 regular paragraphs first so the table lands in the overflow batch
		const overflowChildren = [...makeChildren(100), tableBlock];
		await createNotionPage(client, 'db4', { Name: {} }, overflowChildren);

		expect(createdArgs?.children?.length).toBe(100);
		// First append: the overflow batch (table without nested children)
		expect(appendCalls[0]?.block_id).toBe('page_4');
		const sentTable = appendCalls[0]?.children?.find((b: any) => b.type === 'table');
		expect(sentTable).toBeDefined();
		// Children should be stripped from the table when appending to the page
		expect(sentTable?.table?.children).toBeUndefined();

		// Second append: table rows appended to the table block itself
		expect(appendCalls[1]?.block_id).toBe('block_0');
		expect(appendCalls[1]?.children).toHaveLength(1);
		expect(appendCalls[1]?.children?.[0]?.type).toBe('table_row');
	});
});


