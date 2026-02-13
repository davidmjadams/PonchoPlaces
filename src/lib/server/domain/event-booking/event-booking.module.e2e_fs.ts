import type { EventBookingModule } from './event-booking.module';
import { createEventBookingService } from './event-booking.service';
import { createFileEventBookingStore } from './event-booking.store.fs';

export default function eventBookingModuleE2EFileSystem(): EventBookingModule {
	const eventBookingStore = createFileEventBookingStore({
		path: new URL('./seed/seed.json', import.meta.url).pathname
	});
	const eventBookingService = createEventBookingService({ eventBookingStore });

	return { eventBookingStore, eventBookingService };
}
