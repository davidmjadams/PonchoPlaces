import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
	const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');
	const events = await eventBookingService.listPublicEvents({});

	return {
		events
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	createOrganizer: async () => {
		// TODO(v1-onboarding): persist organizer creation + membership assignment.
		return { created: true };
	},
	impersonate: async () => {
		// TODO(v3-admin): enforce platform admin role and record audit entry.
		return { impersonation: 'started' };
	}
};
