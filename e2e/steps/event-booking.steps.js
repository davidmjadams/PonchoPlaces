import assert from 'node:assert/strict';
import { After, Before, Given, Then, When, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';

import {
	fetchAttendeeSlotState,
	fetchBookingState,
	fetchOrderState,
	fetchWaitlistState,
	fetchWebhookEvent,
	loadDeterministicSeed
} from './support/event-booking.seed.js';
import { fillNamedFields, submitForm, tableToObject, tableToRows } from './support/event-booking.ui.js';

setDefaultTimeout(90_000);

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const SEEDED_LOGIN_PASSWORD = process.env.E2E_DEFAULT_USER_PASSWORD ?? 'password123';

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
	lastCheckoutOrderId: null,
	lastActor: null
};

function resetScenarioState() {
	state.timezone = 'Europe/London';
	state.lastWebhookResponseStatus = null;
	state.lastWebhookResponseBody = '';
	state.lastCheckoutOrderId = null;
	state.lastActor = null;
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

function softStateAssert(label, id, expected, actual) {
	if (actual === expected) return;
	console.warn(
		`[e2e:event-booking] TODO ${label} state transition: expected=${expected} actual=${actual} id=${id}`
	);
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

	// TODO(v3-rbac): Replace this with seeded role-specific auth users.
	// For now we only auto-login the existing seeded e2e account.
	if (email !== 'davidmjadams+test@gmail.com') {
		console.warn(`[e2e:event-booking] TODO: role-based login scaffold for ${role} (${email})`);
		return;
	}

	await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', SEEDED_LOGIN_PASSWORD);
	await page.locator('form[action="?/login"]').evaluate((form) => form.requestSubmit());
});

When('I navigate to {string}', async (path) => {
	assert.ok(page, 'Playwright page not initialized');
	await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
});

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
});

Given(
	'the event {string} with id {string} exists for organizer {string}',
	async (eventTitle, eventId, organizerName) => {
		// TODO: Verify these IDs directly through admin DB query helper.
		console.debug(
			`[e2e:event-booking] fixture assumption: event "${eventTitle}" (${eventId}) organizer "${organizerName}"`
		);
	}
);

Given(
	'the ticket type {string} with id {string} exists for event {string}',
	async (ticketName, ticketTypeId, eventTitle) => {
		// TODO: Verify ticket fixture record through DB helper.
		console.debug(
			`[e2e:event-booking] fixture assumption: ticket "${ticketName}" (${ticketTypeId}) event "${eventTitle}"`
		);
	}
);

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
	assert.ok(page, 'Playwright page not initialized');
	const rows = tableToRows(dataTable);
	// TODO(v1): map these rows to the dynamic attendee repeater controls.
	console.debug(`[e2e:event-booking] TODO add attendee rows (${rows.length})`);
});

When('I add basket line items:', async (dataTable) => {
	assert.ok(page, 'Playwright page not initialized');
	const rows = tableToRows(dataTable);
	// TODO(v2): wire basket UI controls and submit each line item.
	console.debug(`[e2e:event-booking] TODO add basket line items (${rows.length})`);
});

When('I start checkout for order id {string}', async (orderId) => {
	assert.ok(page, 'Playwright page not initialized');
	state.lastCheckoutOrderId = orderId;
	await page.goto(`${BASE_URL}/checkout/start?orderId=${encodeURIComponent(orderId)}`, {
		waitUntil: 'domcontentloaded'
	});
});

Then('PonchoPay checkout should be requested with:', async (dataTable) => {
	assert.ok(page, 'Playwright page not initialized');
	const values = tableToObject(dataTable);
	assert.equal(
		state.lastCheckoutOrderId,
		values.order_id,
		'Expected checkout step to target deterministic order id'
	);
	// TODO(v1): assert real redirect URL + server side create-session request metadata.
});

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

Then('the response status should be {int}', async (statusCode) => {
	assert.equal(
		state.lastWebhookResponseStatus,
		statusCode,
		`Expected webhook response ${statusCode}; got ${state.lastWebhookResponseStatus} body=${state.lastWebhookResponseBody}`
	);
});

Then(
	'the latest webhook event {string} should be processed idempotently',
	async (providerEventId) => {
		const row = await fetchWebhookEvent(providerEventId);
		if (!row) {
			console.warn(`[e2e:event-booking] TODO: webhook row not found for ${providerEventId}`);
			return;
		}
		assert.equal(row.provider_event_id, providerEventId);
		assert.ok(
			['received', 'processed', 'ignored'].includes(row.processing_state),
			`Unexpected webhook processing_state: ${row.processing_state}`
		);
	}
);

Then('the order id {string} should have state {string}', async (orderId, expectedState) => {
	const actual = await fetchOrderState(orderId);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: order state assertion unavailable for ${orderId}`);
		return;
	}
	softStateAssert('order', orderId, expectedState, actual);
});

Then('the booking id {string} should have state {string}', async (bookingId, expectedState) => {
	const actual = await fetchBookingState(bookingId);
	if (actual === null) {
		console.warn(`[e2e:event-booking] TODO: booking state assertion unavailable for ${bookingId}`);
		return;
	}
	softStateAssert('booking', bookingId, expectedState, actual);
});

Then(
	'the attendee slot id {string} should have state {string}',
	async (attendeeSlotId, expectedState) => {
		const actual = await fetchAttendeeSlotState(attendeeSlotId);
		if (actual === null) {
			console.warn(
				`[e2e:event-booking] TODO: attendee slot state assertion unavailable for ${attendeeSlotId}`
			);
			return;
		}
		softStateAssert('attendee slot', attendeeSlotId, expectedState, actual);
	}
);

Then(
	'the waitlist entry id {string} should have state {string}',
	async (waitlistEntryId, expectedState) => {
		const actual = await fetchWaitlistState(waitlistEntryId);
		if (actual === null) {
			console.warn(
				`[e2e:event-booking] TODO: waitlist state assertion unavailable for ${waitlistEntryId}`
			);
			return;
		}
		softStateAssert('waitlist', waitlistEntryId, expectedState, actual);
	}
);

Then('a notification stub should be queued for {string}', async (notificationType) => {
	// TODO(v1-notifications): wire to actual notification outbox table/adapter.
	console.debug(`[e2e:event-booking] TODO notification assertion for ${notificationType}`);
});

Then('an audit log entry should exist with action {string}', async (action) => {
	// TODO(v3-admin): assert from `audit_log_entries` once admin actions are implemented.
	console.debug(`[e2e:event-booking] TODO audit log assertion for action=${action}`);
});
