import * as core from '@actions/core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { markdownToNotionBlocks } from './converter';

async function run(): Promise<void> {
	try {
		const inlineMarkdown = core.getInput('markdown', { required: false }) || '';
		const markdownPath = core.getInput('markdown_path', { required: false }) || '';

		let markdownSource = inlineMarkdown.trim();
		if (markdownSource.length === 0 && markdownPath) {
			const absPath = resolve(markdownPath);
			markdownSource = readFileSync(absPath, 'utf8');
		}

		if (!markdownSource || markdownSource.trim().length === 0) {
			core.setFailed("No markdown provided. Supply 'markdown' or 'markdown_path'.");
			return;
		}

		const blocks = await markdownToNotionBlocks(markdownSource);
		const blocksJson = JSON.stringify(blocks);
		core.setOutput('blocks_json', blocksJson);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		core.setFailed(message);
	}
}

run();
