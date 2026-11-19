package com.patterns2learn.box.proxy.before;

import com.patterns2learn.box.proxy.Booking;
import com.patterns2learn.box.proxy.BookingRepository;
import com.patterns2learn.box.proxy.ClassFullException;

/** The real subject: only business logic, no transaction code at all. */
public class PlainBookingService implements BookingOperations {
    private final BookingRepository repo;

    public PlainBookingService(BookingRepository repo) {
        this.repo = repo;
    }

    @Override
    public Booking book(long sessionId, String athlete) {
        repo.insertBooking(sessionId, athlete);
        if (!repo.takeSpot(sessionId)) {
            throw new ClassFullException(sessionId);
        }
        return new Booking(sessionId, athlete);
    }
}
