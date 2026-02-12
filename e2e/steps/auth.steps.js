import assert from 'node:assert/strict';
import { After, Before, Given, Then, When, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';

setDefaultTimeout(60_000);

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const SEEDED_AUTH_EMAIL = 'davidmjadams+test@gmail.com';
const SEEDED_AUTH_PASSWORD = 'password123';

/** @type {string | undefined} */
let scenarioEmail;

function withTimeout(promise, ms, label) {
	let t;
	const timeout = new Promise((_, reject) => {
		t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function summarizeText(text, maxLen = 800) {
	if (!text) return String(text);
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= maxLen) return normalized;
	return `${normalized.slice(0, maxLen)}…`;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @type {import('playwright').Browser | undefined} */
let browser;
/** @type {import('playwright').Page | undefined} */
let page;

Before(async () => {
	browser = await chromium.launch();
	const context = await browser.newContext();
	page = await context.newPage();
	scenarioEmail = undefined;
});

After(async () => {
	await browser?.close();
	browser = undefined;
	page = undefined;
});

Given('I am a logged out user', async () => {
	assert.ok(page, 'Playwright page not initialized');
	// Clear cookies/storage for a clean auth state.
	await page.context().clearCookies();
	await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
});

Given('I am a logged out user with email {string}', async (emailToken) => {
	assert.ok(page, 'Playwright page not initialized');
	// Clear cookies/storage for a clean auth state.
	await page.context().clearCookies();
	await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

	if (emailToken === '{}') {
		scenarioEmail = `e2e-signup-${Date.now()}@example.com`;
		return;
	}

	scenarioEmail = emailToken;
});

When('I try to access the restricted {string} page', async (slug) => {
	assert.ok(page, 'Playwright page not initialized');
	await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'networkidle' });
});

Then('I am taken to the login screen', async () => {
	assert.ok(page, 'Playwright page not initialized');
	await page.waitForURL(/\/login(\?|$)/);
	const content = await page.textContent('body');
	assert.ok(typeof content === 'string', `Expected body text but got: ${String(content)}`);
	assert.ok(
		content.includes('Login'),
		`Expected login page to include "Login", but got: ${JSON.stringify(summarizeText(content))}`
	);
});

Given('I am a logged in user', async () => {
	assert.ok(page, 'Playwright page not initialized');

	// Ensure we start from a clean auth state (so step order doesn't matter).
	await page.context().clearCookies();

	console.debug(`[e2e] signing in via UI at ${BASE_URL}`);
	await withTimeout(
		page.goto(`${BASE_URL}/login?redirectTo=%2Frestricted-items`, { waitUntil: 'networkidle' }),
		15_000,
		'page.goto(/login)'
	);
	console.debug('[e2e] login page loaded');
	await withTimeout(page.fill('input[name="email"]', SEEDED_AUTH_EMAIL), 5_000, 'fill(email)');
	console.debug('[e2e] email filled');
	await withTimeout(page.fill('input[name="password"]', SEEDED_AUTH_PASSWORD), 5_000, 'fill(password)');
	console.debug('[e2e] password filled');
	await withTimeout(
		page.locator('form[action="?/login"]').evaluate((form) => form.requestSubmit()),
		5_000,
		'submit(login)'
	);
	console.debug('[e2e] sign in submitted');

	// Ensure we're actually authenticated before continuing.
	// If auth fails, surface the error so we can debug quickly.
	await withTimeout(
		page.waitForFunction(() => window.location.pathname !== '/login'),
		15_000,
		'waitForRedirectFromLogin'
	);
	const currentUrl = page.url();
	const loginError = await page.locator('[data-testid="login-error"]').textContent().catch(() => null);
	if (!currentUrl.includes('/restricted-items')) {
		throw new Error(`Login did not redirect. url=${currentUrl} error=${JSON.stringify(loginError)}`);
	}
});

When('I visit the signup page', async () => {
	assert.ok(page, 'Playwright page not initialized');
	await withTimeout(page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' }), 15_000, 'page.goto(/signup)');
});

When('I enter email {string} and password {string}', async (emailToken, passwordToken) => {
	assert.ok(page, 'Playwright page not initialized');

	const email =
		emailToken === '{email}'
			? scenarioEmail
			: emailToken === '{}'
				? `e2e-signup-${Date.now()}@example.com`
				: emailToken;

	if (!email) throw new Error(`No scenario email available for token: ${emailToken}`);

	const password = passwordToken === '{}' ? 'password123' : passwordToken;

	await withTimeout(page.fill('input[name="email"]', email), 15_000, 'fill(signup-email)');
	await withTimeout(page.fill('input[name="password"]', password), 15_000, 'fill(signup-password)');

	await withTimeout(page.locator('form').evaluate((form) => form.requestSubmit()), 5_000, 'submit(signup)');
});

When('I enter an email and password', async () => {
	assert.ok(page, 'Playwright page not initialized');

	const email = `e2e-signup-${Date.now()}@example.com`;
	const password = 'password123';

	await withTimeout(page.fill('input[name="email"]', email), 15_000, 'fill(signup-email)');
	await withTimeout(page.fill('input[name="password"]', password), 15_000, 'fill(signup-password)');
	await withTimeout(page.locator('form').evaluate((form) => form.requestSubmit()), 5_000, 'submit(signup)');
});

Then('I am logged in and I am redirected to the {string} page', async (slug) => {
	assert.ok(page, 'Playwright page not initialized');

	await withTimeout(page.waitForURL(new RegExp(`/${slug}(\\?|$)`)), 15_000, 'waitForURL(redirect)');

	const urlAfter = page.url();
	if (urlAfter.includes('/login')) {
		const loginError = await page.locator('[data-testid="login-error"]').textContent().catch(() => null);
		throw new Error(
			`Expected to be logged in (not on /login). url=${urlAfter} error=${JSON.stringify(loginError)}`
		);
	}

	// Stronger assertion that we're authenticated: restricted page should not bounce to /login.
	await withTimeout(
		page.goto(`${BASE_URL}/restricted-items`, { waitUntil: 'networkidle' }),
		15_000,
		'page.goto(/restricted-items after signup)'
	);
	if (page.url().includes('/login')) {
		throw new Error(`Expected to access restricted page after signup, but was redirected. url=${page.url()}`);
	}
});

When('I go to the profile page', async () => {
	assert.ok(page, 'Playwright page not initialized');
	await withTimeout(page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' }), 15_000, 'page.goto(/profile)');
});

When('I set my profile name to {string} and description to {string}', async (name, description) => {
	assert.ok(page, 'Playwright page not initialized');

	await withTimeout(page.fill('input[name="name"]', name), 15_000, 'fill(profile-name)');
	await withTimeout(page.fill('textarea[name="description"]', description), 15_000, 'fill(profile-description)');

	await withTimeout(
		page.locator('form[action="?/save"]').evaluate((form) => form.requestSubmit()),
		5_000,
		'submit(profile-save)'
	);
});

Then('my profile name is {string} and description is {string}', async (name, description) => {
	assert.ok(page, 'Playwright page not initialized');

	// Ensure the save succeeded (optional but gives better failure messages).
	const errorText = await page.locator('[data-testid="profile-error"]').textContent().catch(() => null);
	if (errorText) {
		throw new Error(`Profile save error: ${JSON.stringify(errorText)}`);
	}

	// Reload to prove persistence (not just client state).
	await withTimeout(page.reload({ waitUntil: 'networkidle' }), 15_000, 'profile.reload');

	const nameValue = await page.inputValue('input[name="name"]');
	const descriptionValue = await page.inputValue('textarea[name="description"]');

	assert.equal(nameValue, name);
	assert.equal(descriptionValue, description);
});

Then('I can see the list of restricted items', async () => {
	assert.ok(page, 'Playwright page not initialized');
	await page.waitForURL(/\/restricted-items(\?|$)/);
	const content = await page.textContent('body');
	assert.ok(typeof content === 'string', `Expected body text but got: ${String(content)}`);
	assert.ok(
		content.toLowerCase().includes('restricted item'),
		`Expected restricted items page to include restricted item text, but got: ${JSON.stringify(
			summarizeText(content)
		)}`
	);
});

When('I click the {string} header link', async (label) => {
	assert.ok(page, 'Playwright page not initialized');

	const header = page.locator('header');
	await withTimeout(header.waitFor(), 10_000, 'waitFor(header)');

	const nameRe = new RegExp(`^${escapeRegExp(label)}$`, 'i');

	const link = header.getByRole('link', { name: nameRe });
	if ((await link.count()) > 0) {
		await withTimeout(link.first().click(), 10_000, `click(header link: ${label})`);
		return;
	}

	// Fallback in case the header uses a button instead of a link.
	const button = header.getByRole('button', { name: nameRe });
	await withTimeout(button.first().click(), 10_000, `click(header button: ${label})`);
});

Then('I should be logged out', async () => {
	assert.ok(page, 'Playwright page not initialized');

	// Wait for the logout redirect to settle (logout link click should land on home).
	await withTimeout(page.waitForURL((url) => url.pathname === '/'), 15_000, 'waitForURL(/ after logout)');

	// Assert UI state: Login link is visible (and by implication we're logged out).
	const header = page.locator('header');
	const loginLink = header.getByRole('link', { name: /^login$/i }).first();
	await withTimeout(loginLink.waitFor({ state: 'visible' }), 10_000, 'waitFor(header login visible)');
});

Then('I should be taken to the homepage', async () => {
	assert.ok(page, 'Playwright page not initialized');
	await withTimeout(page.waitForURL((url) => url.pathname === '/'), 15_000, 'waitForURL(/)');
});

Then('the {string} link should show in the header', async (label) => {
	assert.ok(page, 'Playwright page not initialized');
	const header = page.locator('header');
	const nameRe = new RegExp(`^${escapeRegExp(label)}$`, 'i');
	const link = header.getByRole('link', { name: nameRe }).first();
	await withTimeout(link.waitFor({ state: 'visible' }), 10_000, `waitFor(header link visible: ${label})`);
});

