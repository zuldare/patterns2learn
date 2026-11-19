package com.patterns2learn.box.proxy.web;

import com.patterns2learn.box.proxy.Booking;
import com.patterns2learn.box.proxy.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookingController {
    private final BookingService bookings; // in reality: the transactional proxy

    public BookingController(BookingService bookings) {
        this.bookings = bookings;
    }

    @PostMapping("/api/sessions/{sessionId}/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public Booking book(@PathVariable long sessionId, @RequestParam String athlete) {
        return bookings.book(sessionId, athlete);
    }
}
