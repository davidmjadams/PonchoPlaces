import { readFile } from 'node:fs/promises';

import type { EventBookingStorePort, GetEventDetailInput, ListEventsInput } from './event-booking.ports';
import type {
	EventBookingBooking,
	EventBookingEvent,
	EventBookingOrder,
	EventBookingSeedData,
	EventDetail,
	EventSummary
} from './event-booking.types';

export type FileEventBookingStoreOptions = {
	path: string;
};

function assertSeedData(value: unknown): asserts value is EventBookingSeedData {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Invalid event booking seed file: expected object');
	}

	const candidate = value as Record<string, unknown>;
	if (!Array.isArray(candidate.organizers)) throw new Error('Invalid event booking seed: organizers[] required');
	if (!Array.isArray(candidate.events)) throw new Error('Invalid event booking seed: events[] required');
	if (!Array.isArray(candidate.sessions)) throw new Error('Invalid event booking seed: sessions[] required');
	if (!Array.isArray(candidate.ticketTypes)) throw new Error('Invalid event booking seed: ticketTypes[] required');
	if (!Array.isArray(candidate.bookings)) throw new Error('Invalid event booking seed: bookings[] required');
	if (!Array.isArray(candidate.orders)) throw new Error('Invalid event booking seed: orders[] required');
}

function toEventSummary(event: EventBookingEvent, organizerName: string, organizerSlug: string): EventSummary {
	return {
		id: event.id,
		organizerSlug,
		organizerName,
		slug: event.slug,
		title: event.title,
		description: event.description,
		eventType: event.eventType,
		timezone: event.timezone,
		locationName: event.locationName,
		startsAt: event.startsAt,
		endsAt: event.endsAt,
		capacityTotal: event.capacityTotal,
		confirmedAttendeeCount: event.confirmedAttendeeCount,
		waitlistEnabled: event.waitlistEnabled
	};
}

export const createFileEventBookingStore = ({
	path
}: FileEventBookingStoreOptions): EventBookingStorePort & {
	findBookingById: (bookingId: string) => Promise<EventBookingBooking | null>;
} => {
	const load = async (): Promise<EventBookingSeedData> => {
		const raw = await readFile(path, 'utf8');
		const parsed = JSON.parse(raw) as unknown;
		assertSeedData(parsed);
		return parsed;
	};

	return {
		listPublicEvents: async ({ organizerSlug }: ListEventsInput) => {
			const seed = await load();
			const organizersById = new Map(seed.organizers.map((o) => [o.id, o]));

			return seed.events
				.filter((event) => event.status === 'published')
				.filter((event) => {
					if (!organizerSlug) return true;
					const organizer = organizersById.get(event.organizerId);
					return organizer?.slug === organizerSlug;
				})
				.map((event) => {
					const organizer = organizersById.get(event.organizerId);
					if (!organizer) {
						throw new Error(`Event ${event.id} references missing organizer ${event.organizerId}`);
					}
					return toEventSummary(event, organizer.name, organizer.slug);
				});
		},

		findEventDetail: async ({ organizerSlug, eventSlug }: GetEventDetailInput): Promise<EventDetail | null> => {
			const seed = await load();
			const organizer = seed.organizers.find((o) => o.slug === organizerSlug);
			if (!organizer) return null;

			const event = seed.events.find(
				(e) => e.organizerId === organizer.id && e.slug === eventSlug && e.status === 'published'
			);
			if (!event) return null;

			return {
				...toEventSummary(event, organizer.name, organizer.slug),
				sessions: seed.sessions.filter((session) => session.eventId === event.id),
				ticketTypes: seed.ticketTypes.filter((ticketType) => ticketType.eventId === event.id)
			};
		},

		findOrderById: async (orderId: string): Promise<EventBookingOrder | null> => {
			const seed = await load();
			return seed.orders.find((order) => order.id === orderId) ?? null;
		},

		findBookingById: async (bookingId: string): Promise<EventBookingBooking | null> => {
			const seed = await load();
			return seed.bookings.find((booking) => booking.id === bookingId) ?? null;
		},

		listBookingsByOrganizer: async (organizerSlug: string): Promise<EventBookingBooking[]> => {
			const seed = await load();
			return seed.bookings.filter((booking) => booking.organizerSlug === organizerSlug);
		}
	};
};
