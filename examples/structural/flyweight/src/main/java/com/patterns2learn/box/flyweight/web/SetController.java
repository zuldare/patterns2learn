package com.patterns2learn.box.flyweight.web;

import com.patterns2learn.box.flyweight.MovementCatalog;
import com.patterns2learn.box.flyweight.SetLog;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SetController {
    public record SetRequest(String athlete, String movement, int reps, int kg) {}
    public record SetView(String athlete, String movement, int reps, int kg, String line) {}
    public record Stats(int sets, int movementsCreated) {}

    private final SetLog log;
    private final MovementCatalog catalog;

    public SetController(SetLog log, MovementCatalog catalog) {
        this.log = log;
        this.catalog = catalog;
    }

    @PostMapping("/api/sets")
    @ResponseStatus(HttpStatus.CREATED)
    public SetView log(@RequestBody SetRequest req) {
        var s = log.log(req.athlete(), req.movement(), req.reps(), req.kg());
        return new SetView(s.athlete(), s.movement().name(), s.reps(), s.kg(), s.line());
    }

    @GetMapping("/api/sets/stats")
    public Stats stats() {
        return new Stats(log.size(), catalog.created());
    }
}
