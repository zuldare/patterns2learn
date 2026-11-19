package com.patterns2learn.box.builder.web;

import com.patterns2learn.box.builder.ScheduleService;
import com.patterns2learn.box.builder.Scheduled;
import com.patterns2learn.box.builder.SessionRequest;
import java.net.URI;
import java.time.LocalTime;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
public class SessionController {
    private final ScheduleService schedule;

    public SessionController(ScheduleService schedule) {
        this.schedule = schedule;
    }

    // @step:created
    @PostMapping("/api/sessions")
    public ResponseEntity<Scheduled> create(@RequestBody SessionRequest request) {
        Scheduled s = schedule.schedule(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()   // a builder for the URI…
            .path("/{id}")
            .buildAndExpand(s.id())
            .toUri();
        return ResponseEntity.created(location).body(s);                 // …and one for the response
    }
    // @end

    @PostMapping("/api/sessions/templates/{template}")
    public ResponseEntity<Scheduled> fromTemplate(@PathVariable String template,
                                                  @RequestParam LocalTime startsAt,
                                                  @RequestParam(required = false) String coach) {
        Scheduled s = schedule.fromTemplate(template, startsAt, coach);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
            .path("/api/sessions/{id}").buildAndExpand(s.id()).toUri();
        return ResponseEntity.created(location).body(s);
    }

    @GetMapping("/api/sessions/{id}")
    public ResponseEntity<Scheduled> find(@PathVariable long id) {
        return ResponseEntity.of(schedule.find(id));
    }
}
