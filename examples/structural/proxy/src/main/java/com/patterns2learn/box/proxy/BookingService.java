package com.patterns2learn.box.proxy;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    private final BookingRepository repo;

    public BookingService(BookingRepository repo) {
        this.repo = repo;
    }

    // @step:tx-annotation
    @Transactional
    public Booking book(long sessionId, String athlete) {
        if (!repo.sessionExists(sessionId)) {
            throw new UnknownSessionException(sessionId);
        }
        repo.insertBooking(sessionId, athlete);
        if (!repo.takeSpot(sessionId)) {
            throw new ClassFullException(sessionId); // RuntimeException: the proxy rolls back
        }
        return new Booking(sessionId, athlete);
    }
    // @end

    // @step:self-call
    /** ⚠ Deliberate pitfall for the lesson: no @Transactional here, and this.book() skips the proxy. */
    public void bookPair(long sessionId, String athlete, String friend) {
        this.book(sessionId, athlete); // a plain Java call on the real object,
        this.book(sessionId, friend);  // so neither call runs in a transaction
    }
    // @end
}
