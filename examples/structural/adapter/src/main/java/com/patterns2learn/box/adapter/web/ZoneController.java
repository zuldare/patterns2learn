package com.patterns2learn.box.adapter.web;

import com.patterns2learn.box.adapter.ZoneBoard;
import com.patterns2learn.box.adapter.ZoneReading;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ZoneController {
    private final ZoneBoard board;

    public ZoneController(ZoneBoard board) {
        this.board = board;
    }

    /** 200 with the zone, or 204 when the athlete's band has no signal. */
    @GetMapping("/api/zones/{athlete}")
    public ResponseEntity<ZoneReading> zone(@PathVariable String athlete) {
        return board.zoneOf(athlete).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }
}
