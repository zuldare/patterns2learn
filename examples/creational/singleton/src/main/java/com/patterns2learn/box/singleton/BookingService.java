package com.patterns2learn.box.singleton;

import org.springframework.stereotype.Service;

@Service
public class BookingService {
    private final WodCatalog catalog;

    public BookingService(WodCatalog catalog) {
        this.catalog = catalog;
    }

    public Booking book(String wod) {
        return catalog.find(wod).map(w -> new Booking(w.name())).orElseThrow(() -> new UnknownWodException(wod));
    }
}
