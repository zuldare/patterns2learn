package com.patterns2learn.box.command.web;

import com.patterns2learn.box.command.ClassRoster;
import com.patterns2learn.box.command.DeskCommands;
import com.patterns2learn.box.command.FrontDesk;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The client: turns each request into a command and hands it to the desk. */
@RestController
public class DeskController {
    public record BookingRequest(int session, String athlete) {}
    public record MoveRequest(String athlete, int from, int to) {}
    public record ClassView(String name, int capacity, List<String> athletes) {}

    private final FrontDesk desk;
    private final DeskCommands commands;
    private final ClassRoster roster;

    public DeskController(FrontDesk desk, DeskCommands commands, ClassRoster roster) {
        this.desk = desk;
        this.commands = commands;
        this.roster = roster;
    }

    // @step:client
    @PostMapping("/api/desk/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> book(@RequestBody BookingRequest req) {
        return Map.of("done", desk.run(commands.book(req.session(), req.athlete())));
    }

    @PostMapping("/api/desk/undo")
    public Map<String, String> undo() {
        return Map.of("undone", desk.undo().replaceFirst("^undone: ", ""));
    }
    // @end

    @DeleteMapping("/api/desk/bookings")
    public Map<String, String> cancel(@RequestParam int session, @RequestParam String athlete) {
        return Map.of("done", desk.run(commands.cancel(session, athlete)));
    }

    @PostMapping("/api/desk/moves")
    public Map<String, String> move(@RequestBody MoveRequest req) {
        return Map.of("done", desk.run(commands.move(req.athlete(), req.from(), req.to())));
    }

    @GetMapping("/api/desk/log")
    public List<String> log() {
        return desk.log();
    }

    @GetMapping("/api/desk/classes/{id}")
    public ClassView classView(@PathVariable int id) {
        return new ClassView(roster.name(id), roster.capacity(id), roster.athletes(id));
    }
}
