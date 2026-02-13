import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type PonchoPayWebhookPayload = {
	event_id?: string;
	event_type?: string;
	type?: string;
	data?: Record<string, unknown>;
	[key: string]: unknown;
};

const SUPPORTED_EVENT_TYPES = new Set([
	'payment_succeeded',
	'payment_failed',
	'refund_issued',
	'chargeback',
	'payout'
]);

export const POST: RequestHandler = async ({ request, locals }) => {
	let payload: PonchoPayWebhookPayload;
	try {
		payload = (await request.json()) as PonchoPayWebhookPayload;
	} catch {
		return json({ accepted: false, message: 'Invalid JSON body' }, { status: 400 });
	}

	const providerEventId = request.headers.get('x-ponchopay-event-id') ?? payload.event_id ?? null;
	const eventTypeRaw = payload.event_type ?? payload.type ?? null;
	const signature = request.headers.get('x-ponchopay-signature');

	if (!providerEventId || typeof providerEventId !== 'string') {
		return json({ accepted: false, message: 'Missing provider event id' }, { status: 400 });
	}
	if (!eventTypeRaw || typeof eventTypeRaw !== 'string') {
		return json({ accepted: false, message: 'Missing event type' }, { status: 400 });
	}

	// TODO(v1-payments): validate signature using PonchoPay webhook signing docs.
	// Keep explicit placeholder so production integration is not silently incomplete.
	if (!signature || signature.trim().length === 0) {
		console.warn('[ponchopay:webhook] Missing signature header. TODO: enforce verification before prod.');
	}

	const eventType = eventTypeRaw.trim();
	const { data: webhookRow, error: webhookError } = await locals.supabase.rpc(
		'upsert_payment_webhook_event',
		{
			p_provider: 'ponchopay',
			p_provider_event_id: providerEventId,
			p_event_type: eventType,
			p_payload: payload
		}
	);

	if (webhookError) {
		return json(
			{
				accepted: false,
				message: `Failed to persist webhook event: ${webhookError.message}`
			},
			{ status: 500 }
		);
	}

	// TODO(v1-v3-webhooks): apply deterministic order/booking transitions in a transactional handler.
	// - payment_succeeded: confirm order + bookings idempotently
	// - payment_failed: keep order pending_payment or mark cancelled based on policy
	// - refund_issued: update refund/order/attendee states
	// - chargeback/payout: record reconciliation/audit rows
	if (!SUPPORTED_EVENT_TYPES.has(eventType)) {
		console.warn(`[ponchopay:webhook] Unrecognized event_type "${eventType}" stored for later reconciliation.`);
	}

	return json(
		{
			accepted: true,
			message: 'Webhook accepted',
			provider: 'ponchopay',
			providerEventId,
			eventType,
			processingState: webhookRow?.processing_state ?? 'received'
		},
		{ status: 202 }
	);
};
