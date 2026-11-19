package com.patterns2learn.box.proxy.before;

import com.patterns2learn.box.proxy.Booking;

/** The contract both the real service and its proxy fulfil. */
public interface BookingOperations {
    Booking book(long sessionId, String athlete);
}
