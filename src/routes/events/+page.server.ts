import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { PageServerLoad } from './$types';

export const load = (async ({ url }) => {
	const organizerSlug = url.searchParams.get('organizer') ?? undefined;
	const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');

	const events = await eventBookingService.listPublicEvents({ organizerSlug });

	return {
		events,
		organizerSlug: organizerSlug ?? null
	};
}) satisfies PageServerLoad;
