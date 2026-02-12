import type { EventBookingServicePort, EventBookingStorePort } from './event-booking.ports';
import { createEventBookingService } from './event-booking.service';
import { createFileEventBookingStore } from './event-booking.store.fs';

export type EventBookingModule = {
	eventBookingStore: EventBookingStorePort;
	eventBookingService: EventBookingServicePort;
};

export default function eventBookingModule(): EventBookingModule {
	const eventBookingStore = createFileEventBookingStore({
		path: new URL('./seed/seed.json', import.meta.url).pathname
	});
	const eventBookingService = createEventBookingService({ eventBookingStore });

	return { eventBookingStore, eventBookingService };
}
