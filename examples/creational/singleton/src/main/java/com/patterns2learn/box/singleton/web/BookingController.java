package com.patterns2learn.box.singleton.web;

import com.patterns2learn.box.singleton.Booking;
import com.patterns2learn.box.singleton.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookingController {
    private final BookingService bookings;

    public BookingController(BookingService bookings) {
        this.bookings = bookings;
    }

    @PostMapping("/api/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public Booking book(@RequestParam String wod) {
        return bookings.book(wod);
    }
}
