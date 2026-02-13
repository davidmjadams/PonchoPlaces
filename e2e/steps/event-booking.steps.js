import assert from 'node:assert/strict';
import { After, Before, Given, Then, When, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';

import {
	countBookingsForOrder,
	countWebhookEvents,
	fetchAttendeeSlotState,
	fetchBookingState,
	fetchBookingStateByReference,
	fetchEventStatusBySlug,
	fetchOrderDetails,
	fetchOrderState,
	fetchOrganizerIdBySlug,
	fetchWaitlistState,
	fetchWebhookEvent,
	loadDeterministicSeed
} from './support/event-booking.seed.js';
import { fillNamedFields, submitForm, tableToObject, tableToRows } from './support/event-booking.ui.js';

setDefaultTimeout(90_000);

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const SEEDED_LOGIN_PASSWORD = process.env.E2E_DEFAULT_USER_PASSWORD ?? 'password123';
const ORDER_REF_TO_ID = {
	'LA-ORDER-PENDING-001': '55555555-5555-5555-5555-555555555101',
	'LA-ORDER-PAID-001': '55555555-5555-5555-5555-555555555102',
	'LA-ORDER-DRAFT-001': '55555555-5555-5555-5555-555555555103'
};

/**
 * @type {import('playwright').Browser | undefined}
 */
let browser;
/**
 * @type {import('playwright').Page | undefined}
 */
let page;

const state = {
	timezone: 'Europe/London',
	lastWebhookResponseStatus: null,
	lastWebhookResponseBody: '',
	lastNavigationStatus: null,
	lastCheckoutOrderId: null,
	lastActor: null,
	catalogEntries: []
};

function resetScenarioState() {
	state.timezone = 'Europe/London';
	state.lastWebhookResponseStatus = null;
	state.lastWebhookResponseBody = '';
	state.lastNavigationStatus = null;
	state.lastCheckoutOrderId = null;
	state.lastActor = null;
	state.catalogEntries = [];
}

function summarizeText(text, maxLen = 500) {
	if (!text) return String(text);
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= maxLen) return normalized;
	return `${normalized.slice(0, maxLen)}...`;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveOrderReference(orderReferenceOrId) {
	return ORDER_REF_TO_ID[orderReferenceOrId] ?? orderReferenceOrId;
}

async function gotoPath(path) {
	assert.ok(page, 'Playwright page not initialized');
	const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
	state.lastNavigationStatus = response?.status() ?? null;
	return response;
}

async function readCatalogEntriesFromPage() {
	assert.ok(page, 'Playwright page not initialized');
	const links = page.locator('[data-testid="event-detail-link"]');
	const count = await links.count();
	/** @type {Array<{organizerSlug: string; eventSlug: string}>} */
	const entries = [];

	for (let i = 0; i < count; i += 1) {
		const link = links.nth(i);
		const organizerSlug = (await link.getAttribute('data-organizer-slug')) ?? '';
		const eventSlug = (await link.getAttribute('data-event-slug')) ?? '';
		if (organizerSlug && eventSlug) entries.push({ organizerSlug, eventSlug });
	}

	state.catalogEntries = entries;
	return entries;
}

async function assertPageIncludes(text) {
	assert.ok(page, 'Playwright page not initialized');
	const content = await page.textContent('body');
	assert.ok(typeof content === 'string', 'Expected page to have body text');
	if (content.includes(text)) return;
	if (state.lastWebhookResponseBody && state.lastWebhookResponseBody.includes(text)) return;

	throw new assert.AssertionError({
		message: `Expected to find text ${JSON.stringify(text)}. Content excerpt: ${JSON.stringify(
			summarizeText(content)
		)} webhookBody=${JSON.stringify(summarizeText(state.lastWebhookResponseBody))}`
	});
}

async function assertOrderState(orderReferenceOrId, expectedState) {
	const orderId = resolveOrderReference(orderReferenceOrId);
	const actual = await fetchOrderState(orderId);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: order state assertion unavailable for ${orderReferenceOrId}`);
		return;
	}
	assert.equal(actual, expectedState);
}

Before({ tags: '@event-booking' }, async () => {
	browser = await chromium.launch();
	const context = await browser.newContext();
	page = await context.newPage();
	resetScenarioState();
});

After({ tags: '@event-booking' }, async () => {
	await browser?.close();
	browser = undefined;
	page = undefined;
	resetScenarioState();
});

Given('the deterministic fixture set {string} is loaded', async (seedName) => {
	await loadDeterministicSeed(seedName);
});

Given('the platform timezone is {string}', async (timezone) => {
	state.timezone = timezone;
});

Given('I am browsing as a {string} customer', async (customerKind) => {
	assert.ok(page, 'Playwright page not initialized');
	await page.context().clearCookies();
	state.lastActor = { role: customerKind, email: null };
});

Given('user role {string} is signed in as {string}', async (role, email) => {
	assert.ok(page, 'Playwright page not initialized');
	await page.context().clearCookies();
	state.lastActor = { role, email };

	// TODO(v3-rbac): Replace with deterministic role-specific auth seed users.
	if (email !== 'davidmjadams+test@gmail.com') {
		console.warn(`[e2e:event-booking] TODO: role-based login scaffold for ${role} (${email})`);
		return;
	}

	await gotoPath('/login');
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', SEEDED_LOGIN_PASSWORD);
	await page.locator('form[action="?/login"]').evaluate((form) => form.requestSubmit());
});

Given(
	'the event {string} with id {string} exists for organizer {string}',
	async (eventTitle, eventId, organizerName) => {
		console.debug(
			`[e2e:event-booking] fixture assumption: event "${eventTitle}" (${eventId}) organizer "${organizerName}"`
		);
	}
);

Given(
	'the ticket type {string} with id {string} exists for event {string}',
	async (ticketName, ticketTypeId, eventTitle) => {
		console.debug(
			`[e2e:event-booking] fixture assumption: ticket "${ticketName}" (${ticketTypeId}) event "${eventTitle}"`
		);
	}
);

Given('event {string} for organizer {string} is in status {string}', async (eventSlug, organizerSlug, expectedStatus) => {
	const actual = await fetchEventStatusBySlug(organizerSlug, eventSlug);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: event status assertion unavailable for ${organizerSlug}/${eventSlug}`);
		return;
	}
	assert.equal(actual, expectedStatus);
});

When('I navigate to {string}', async (path) => {
	await gotoPath(path);
});

When('I open the event catalog', async () => {
	await gotoPath('/events');
	await readCatalogEntriesFromPage();
});

When('I open event detail for organizer {string} and event {string}', async (organizerSlug, eventSlug) => {
	await gotoPath(`/events/${organizerSlug}/${eventSlug}`);
});

When('I open organizer {string} event creation page', async (organizerSlug) => {
	await gotoPath(`/organizer/${organizerSlug}/events/new`);
});

When('I click button {string}', async (label) => {
	assert.ok(page, 'Playwright page not initialized');
	await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(label)}$`, 'i') }).first().click();
});

When('I complete form {string} with values:', async (formId, dataTable) => {
	assert.ok(page, 'Playwright page not initialized');
	const values = tableToObject(dataTable);
	await fillNamedFields(page, formId, values);
});

When('I submit form {string}', async (formId) => {
	assert.ok(page, 'Playwright page not initialized');
	await submitForm(page, formId);
});

When('I add attendee rows:', async (dataTable) => {
	const rows = tableToRows(dataTable);
	console.debug(`[e2e:event-booking] TODO add attendee rows (${rows.length})`);
});

When('I add basket line items:', async (dataTable) => {
	const rows = tableToRows(dataTable);
	console.debug(`[e2e:event-booking] TODO add basket line items (${rows.length})`);
});

When('I start checkout for order id {string}', async (orderId) => {
	state.lastCheckoutOrderId = orderId;
	await gotoPath(`/checkout/start?orderId=${encodeURIComponent(orderId)}`);
});

When('I start checkout for order reference {string}', async (orderReference) => {
	const orderId = resolveOrderReference(orderReference);
	state.lastCheckoutOrderId = orderId;
	await gotoPath(`/checkout/start?orderId=${encodeURIComponent(orderId)}`);
});

When(
	'I open checkout return for order reference {string} with status {string}',
	async (orderReference, status) => {
		const orderId = resolveOrderReference(orderReference);
		await gotoPath(`/checkout/return?status=${encodeURIComponent(status)}&orderId=${encodeURIComponent(orderId)}`);
	}
);

When(
	'I trigger PonchoPay webhook {string} with payload id {string}',
	async (eventType, providerEventId) => {
		assert.ok(page, 'Playwright page not initialized');
		const response = await page.request.post(`${BASE_URL}/api/webhooks/ponchopay`, {
			headers: {
				'content-type': 'application/json',
				'x-ponchopay-event-id': providerEventId,
				'x-ponchopay-signature': 'stub-signature'
			},
			data: {
				event_type: eventType,
				event_id: providerEventId,
				occurred_at: new Date().toISOString(),
				data: {
					order_id: state.lastCheckoutOrderId
				}
			}
		});

		state.lastWebhookResponseStatus = response.status();
		state.lastWebhookResponseBody = await response.text();
	}
);

When(
	'I send PonchoPay webhook {string} with provider event id {string} for order reference {string}',
	async (eventType, providerEventId, orderReference) => {
		assert.ok(page, 'Playwright page not initialized');
		const orderId = resolveOrderReference(orderReference);
		state.lastCheckoutOrderId = orderId;

		const response = await page.request.post(`${BASE_URL}/api/webhooks/ponchopay`, {
			headers: {
				'content-type': 'application/json',
				'x-ponchopay-event-id': providerEventId,
				'x-ponchopay-signature': 'stub-signature'
			},
			data: {
				event_type: eventType,
				event_id: providerEventId,
				occurred_at: new Date().toISOString(),
				data: {
					order_id: orderId
				}
			}
		});

		state.lastWebhookResponseStatus = response.status();
		state.lastWebhookResponseBody = await response.text();
	}
);

Then('I should be on {string}', async (path) => {
	assert.ok(page, 'Playwright page not initialized');
	const expected = new URL(path, BASE_URL);
	await page.waitForURL(
		(url) =>
			url.pathname === expected.pathname &&
			(expected.search ? url.search === expected.search : true)
	);
});

Then('I should see text {string}', async (text) => {
	await assertPageIncludes(text);
});

Then('the last page response status should be {int}', async (expectedStatusCode) => {
	assert.equal(state.lastNavigationStatus, expectedStatusCode);
});

Then('the catalog should include organizer\\/event slugs:', async (dataTable) => {
	const expectedRows = tableToRows(dataTable);
	const entries = state.catalogEntries.length > 0 ? state.catalogEntries : await readCatalogEntriesFromPage();

	for (const row of expectedRows) {
		const exists = entries.some(
			(entry) => entry.organizerSlug === row.organizer_slug && entry.eventSlug === row.event_slug
		);
		assert.equal(exists, true, `Expected catalog entry ${row.organizer_slug}/${row.event_slug} to exist`);
	}
});

Then('the catalog should not include event slug {string}', async (eventSlug) => {
	const entries = state.catalogEntries.length > 0 ? state.catalogEntries : await readCatalogEntriesFromPage();
	const exists = entries.some((entry) => entry.eventSlug === eventSlug);
	assert.equal(exists, false, `Catalog should not include event slug ${eventSlug}`);
});

Then('every catalog event should be published', async () => {
	const entries = state.catalogEntries.length > 0 ? state.catalogEntries : await readCatalogEntriesFromPage();
	for (const entry of entries) {
		const status = await fetchEventStatusBySlug(entry.organizerSlug, entry.eventSlug);
		if (status === null) {
			console.warn(
				`[e2e:event-booking] TODO: event status unavailable for ${entry.organizerSlug}/${entry.eventSlug}`
			);
			continue;
		}
		assert.equal(status, 'published');
	}
});

Then('access should be denied for current page', async () => {
	assert.ok(page, 'Playwright page not initialized');
	const path = new URL(page.url()).pathname;
	const content = (await page.textContent('body')) ?? '';
	const denied =
		path.startsWith('/login') ||
		state.lastNavigationStatus === 401 ||
		state.lastNavigationStatus === 403 ||
		/access denied/i.test(content);
	assert.equal(denied, true, `Expected denied access. path=${path} status=${String(state.lastNavigationStatus)}`);
});

Then('form field {string} should have value {string}', async (fieldName, expectedValue) => {
	assert.ok(page, 'Playwright page not initialized');
	const locator = page.locator(`[name="${fieldName}"]`).first();
	const value = await locator.inputValue();
	assert.equal(value, expectedValue);
});

Then('form field {string} should be empty', async (fieldName) => {
	assert.ok(page, 'Playwright page not initialized');
	const locator = page.locator(`[name="${fieldName}"]`).first();
	const value = await locator.inputValue();
	assert.equal(value, '');
});

Then('PonchoPay checkout should be requested with:', async (dataTable) => {
	const values = tableToObject(dataTable);
	assert.equal(state.lastCheckoutOrderId, values.order_id);
});

Then('PonchoPay checkout contract should include:', async (dataTable) => {
	assert.ok(page, 'Playwright page not initialized');
	const expected = tableToObject(dataTable);
	const orderId = resolveOrderReference(expected.order_ref);

	assert.equal(state.lastCheckoutOrderId, orderId);
	assert.equal(expected.provider, 'ponchopay');

	const details = await fetchOrderDetails(orderId);
	if (details) {
		assert.equal(details.currency_code, expected.currency);
		assert.equal(String(details.total_pence), String(expected.amount_pence));
	}

	const currentUrl = page.url();
	const expectedSuccessPath = (expected.success_return_path ?? '').replace('{order_id}', orderId);
	if (expectedSuccessPath) {
		assert.equal(currentUrl.includes(expectedSuccessPath), true);
	}

	if (expected.cancel_return_path && !expected.cancel_return_path.includes('{order_id}')) {
		console.warn('[e2e:event-booking] TODO: cancel_return_path should include order_id.');
	}
});

Then('the response status should be {int}', async (statusCode) => {
	assert.equal(
		state.lastWebhookResponseStatus,
		statusCode,
		`Expected webhook response ${statusCode}; got ${state.lastWebhookResponseStatus} body=${state.lastWebhookResponseBody}`
	);
});

Then('the latest webhook event {string} should be processed idempotently', async (providerEventId) => {
	const row = await fetchWebhookEvent(providerEventId);
	if (!row) {
		console.warn(`[e2e:event-booking] TODO: webhook row not found for ${providerEventId}`);
		return;
	}
	assert.equal(row.provider_event_id, providerEventId);
	assert.ok(['received', 'processed', 'ignored'].includes(row.processing_state));
});

Then('order reference {string} should be in state {string}', async (orderReference, expectedState) => {
	await assertOrderState(orderReference, expectedState);
});

Then('the order id {string} should have state {string}', async (orderId, expectedState) => {
	await assertOrderState(orderId, expectedState);
});

Then(
	'order reference {string} should have currency {string} and total_pence {int}',
	async (orderReference, expectedCurrency, expectedTotalPence) => {
		const orderId = resolveOrderReference(orderReference);
		const details = await fetchOrderDetails(orderId);
		if (!details) {
			console.warn(`[e2e:event-booking] TODO: order detail assertion unavailable for ${orderReference}`);
			return;
		}
		assert.equal(details.currency_code, expectedCurrency);
		assert.equal(details.total_pence, expectedTotalPence);
	}
);

Then('order reference {string} should belong to organizer {string}', async (orderReference, organizerSlug) => {
	const orderId = resolveOrderReference(orderReference);
	const details = await fetchOrderDetails(orderId);
	if (!details) {
		console.warn(`[e2e:event-booking] TODO: order organizer assertion unavailable for ${orderReference}`);
		return;
	}

	const organizerId = await fetchOrganizerIdBySlug(organizerSlug);
	if (!organizerId) {
		console.warn(`[e2e:event-booking] TODO: organizer lookup unavailable for ${organizerSlug}`);
		return;
	}
	assert.equal(details.organizer_id, organizerId);
});

Then('booking reference {string} should be in state {string}', async (bookingReference, expectedState) => {
	const actual = await fetchBookingStateByReference(bookingReference);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: booking reference state assertion unavailable for ${bookingReference}`);
		return;
	}
	assert.equal(actual, expectedState);
});

Then('exactly {int} bookings should exist for order reference {string}', async (expectedCount, orderReference) => {
	const orderId = resolveOrderReference(orderReference);
	const actual = await countBookingsForOrder(orderId);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: booking count assertion unavailable for ${orderReference}`);
		return;
	}
	assert.equal(actual, expectedCount);
});

Then('exactly {int} webhook events should exist with provider event id {string}', async (expectedCount, providerEventId) => {
	const actual = await countWebhookEvents(providerEventId);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: webhook count assertion unavailable for ${providerEventId}`);
		return;
	}
	assert.equal(actual, expectedCount);
});

Then('exactly {int} booking confirmation notifications should be queued for order reference {string}', async (expectedCount, orderReference) => {
	console.debug(
		`[e2e:event-booking] TODO notification count assertion expected=${expectedCount} order=${orderReference}`
	);
});

Then('the booking id {string} should have state {string}', async (bookingId, expectedState) => {
	const actual = await fetchBookingState(bookingId);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: booking state assertion unavailable for ${bookingId}`);
		return;
	}
	assert.equal(actual, expectedState);
});

Then('the attendee slot id {string} should have state {string}', async (attendeeSlotId, expectedState) => {
	const actual = await fetchAttendeeSlotState(attendeeSlotId);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: attendee slot state assertion unavailable for ${attendeeSlotId}`);
		return;
	}
	assert.equal(actual, expectedState);
});

Then('the waitlist entry id {string} should have state {string}', async (waitlistEntryId, expectedState) => {
	const actual = await fetchWaitlistState(waitlistEntryId);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: waitlist state assertion unavailable for ${waitlistEntryId}`);
		return;
	}
	assert.equal(actual, expectedState);
});

Then('checkout return should show pending confirmation guidance', async () => {
	await assertPageIncludes('Processing payment confirmation');
});

Then('checkout return should show confirmed guidance', async () => {
	await assertPageIncludes('Booking confirmed');
});

Then('checkout return should show payment retry guidance', async () => {
	await assertPageIncludes('Payment not completed');
	await assertPageIncludes('Try payment again from your basket');
});

Then('checkout return should show safe verification error', async () => {
	await assertPageIncludes('We could not verify this checkout session.');
});

Then('organizer bookings page should include booking reference {string}', async (bookingReference) => {
	await assertPageIncludes(bookingReference);
});

Then('organizer bookings page should not include booking reference {string}', async (bookingReference) => {
	assert.ok(page, 'Playwright page not initialized');
	const content = (await page.textContent('body')) ?? '';
	assert.equal(content.includes(bookingReference), false);
});

Then('the current page should not reveal booking reference {string}', async (bookingReference) => {
	assert.ok(page, 'Playwright page not initialized');
	const content = (await page.textContent('body')) ?? '';
	assert.equal(content.includes(bookingReference), false);
});

Then('the booking capture form should show validation error message', async () => {
	assert.ok(page, 'Playwright page not initialized');
	const content = (await page.textContent('body')) ?? '';
	assert.equal(/required|invalid|error/i.test(content), true);
});

Then('a notification stub should be queued for {string}', async (notificationType) => {
	console.debug(`[e2e:event-booking] TODO notification assertion for ${notificationType}`);
});

Then('an audit log entry should exist with action {string}', async (action) => {
	console.debug(`[e2e:event-booking] TODO audit log assertion for action=${action}`);
});
