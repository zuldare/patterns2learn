package com.patterns2learn.box.prototype.web;

import com.patterns2learn.box.prototype.WeekService;
import com.patterns2learn.box.prototype.WeekService.WeekView;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
public class WeekController {
    public record NewWeek(String template, String name) {}
    public record DayChange(List<String> movements) {}
    public record CopyRequest(String name) {}

    private final WeekService weeks;

    public WeekController(WeekService weeks) {
        this.weeks = weeks;
    }

    @PostMapping("/api/weeks")
    public ResponseEntity<WeekView> create(@RequestBody NewWeek req) {
        WeekView week = weeks.create(req.template(), req.name());
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri().path("/{id}").buildAndExpand(week.id()).toUri();
        return ResponseEntity.created(location).body(week);
    }

    @PostMapping("/api/weeks/{id}/copy")
    public ResponseEntity<WeekView> copy(@PathVariable long id, @RequestBody CopyRequest req) {
        WeekView week = weeks.copyWeek(id, req.name());
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/weeks/{id}").buildAndExpand(week.id()).toUri();
        return ResponseEntity.created(location).body(week);
    }

    @GetMapping("/api/templates")
    public List<String> templates() {
        return weeks.templates();
    }

    @PutMapping("/api/weeks/{id}/days/{day}")
    public WeekView changeDay(@PathVariable long id, @PathVariable String day, @RequestBody DayChange change) {
        return weeks.changeDay(id, day, change.movements());
    }

    @GetMapping("/api/weeks/{id}")
    public WeekView get(@PathVariable long id) {
        return weeks.get(id);
    }

    @GetMapping("/api/templates/{template}")
    public WeekView template(@PathVariable String template) {
        return weeks.template(template);
    }
}
