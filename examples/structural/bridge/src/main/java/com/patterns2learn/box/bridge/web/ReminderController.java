package com.patterns2learn.box.bridge.web;

import com.patterns2learn.box.bridge.Delivery;
import com.patterns2learn.box.bridge.ReminderService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReminderController {
    public record ReminderRequest(String member, String kind, String channel) {}

    private final ReminderService reminders;

    public ReminderController(ReminderService reminders) {
        this.reminders = reminders;
    }

    @PostMapping("/api/reminders")
    public Delivery remind(@RequestBody ReminderRequest req) {
        return reminders.remind(req.member(), req.kind(), req.channel());
    }

    @GetMapping("/api/reminders/channels")
    public List<String> channels() {
        return reminders.channelNames();
    }
}
