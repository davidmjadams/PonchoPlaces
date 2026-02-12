import type { PageServerLoad } from './$types';

export const load = (async () => {
	return {
		entries: [
			{
				id: 'audit-001',
				action: 'seed_event_booking_e2e',
				correlationId: 'seed-baseline-0001',
				occurredAt: new Date().toISOString()
			},
			{
				id: 'audit-002',
				action: 'admin.impersonation.started',
				correlationId: 'impersonation-0001',
				occurredAt: new Date().toISOString()
			}
		]
	};
}) satisfies PageServerLoad;
