import assert from 'node:assert/strict';
import { After, Before, Given, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';

setDefaultTimeout(60_000);

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';

function summarizeText(text, maxLen = 800) {
	if (!text) return String(text);
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= maxLen) return normalized;
	return `${normalized.slice(0, maxLen)}…`;
}

/** @type {import('playwright').Browser | undefined} */
let browser;
/** @type {import('playwright').Page | undefined} */
let page;

Before(async () => {
	browser = await chromium.launch();
	const context = await browser.newContext();
	page = await context.newPage();
});

After(async () => {
	await browser?.close();
	browser = undefined;
	page = undefined;
});

Given('I open the items page', async () => {
	assert.ok(page, 'Playwright page not initialized');
	await page.goto(`${BASE_URL}/items`, { waitUntil: 'networkidle' });
});

Then('I should see {string}', async (text) => {
	assert.ok(page, 'Playwright page not initialized');
	const content = await page.textContent('body');
	assert.ok(
		typeof content === 'string',
		`Expected page to have body text, but got: ${String(content)}`
	);
	if (!content.includes(text)) {
		throw new assert.AssertionError({
			message: `Expected page to include:\n  ${JSON.stringify(
				text
			)}\nBut it was not found in page body text (excerpt):\n  ${JSON.stringify(summarizeText(content))}`,
			expected: text,
			actual: summarizeText(content),
			operator: 'includes'
		});
	}
});

