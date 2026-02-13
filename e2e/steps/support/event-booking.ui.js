import assert from 'node:assert/strict';

/**
 * @param {import('@cucumber/cucumber').DataTable} dataTable
 * @returns {Record<string, string>}
 */
export function tableToObject(dataTable) {
	return dataTable.rowsHash();
}

/**
 * @param {import('@cucumber/cucumber').DataTable} dataTable
 * @returns {Array<Record<string, string>>}
 */
export function tableToRows(dataTable) {
	return dataTable.hashes();
}

/**
 * @param {import('playwright').Page} page
 * @param {string} formId
 * @param {Record<string, string>} values
 */
export async function fillNamedFields(page, formId, values) {
	assert.ok(page, 'Playwright page not initialized');

	for (const [field, rawValue] of Object.entries(values)) {
		const value = rawValue ?? '';
		const scoped = page.locator(`[data-testid="${formId}"] [name="${field}"]`).first();
		const fallback = page.locator(`[name="${field}"]`).first();

		const target = (await scoped.count()) > 0 ? scoped : fallback;
		if ((await target.count()) === 0) {
			console.warn(`[e2e:event-booking] TODO: field "${field}" not found for form "${formId}"`);
			continue;
		}

		const tagName = await target.evaluate((el) => el.tagName.toLowerCase());
		if (tagName === 'input') {
			const inputType = await target.getAttribute('type');
			if (inputType === 'checkbox') {
				const checked = /^(true|1|yes|on)$/i.test(value);
				if (checked) await target.check();
				else await target.uncheck();
				continue;
			}
		}

		if (tagName === 'select') {
			await target.selectOption({ label: value }).catch(async () => {
				await target.selectOption(value);
			});
			continue;
		}

		await target.fill(value);
	}
}

/**
 * @param {import('playwright').Page} page
 * @param {string} formId
 */
export async function submitForm(page, formId) {
	assert.ok(page, 'Playwright page not initialized');

	const scoped = page.locator(`form[data-testid="${formId}"]`).first();
	if ((await scoped.count()) > 0) {
		await scoped.evaluate((form) => {
			if (form instanceof HTMLFormElement) form.requestSubmit();
		});
		return;
	}

	const fallback = page.locator('form').first();
	if ((await fallback.count()) === 0) {
		console.warn(`[e2e:event-booking] TODO: form "${formId}" not found`);
		return;
	}
	await fallback.evaluate((form) => {
		if (form instanceof HTMLFormElement) form.requestSubmit();
	});
}
