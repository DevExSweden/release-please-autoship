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
});


