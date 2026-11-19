package com.patterns2learn.box.mediator.web;

import com.patterns2learn.box.mediator.devices.FinishLine;
import com.patterns2learn.box.mediator.devices.Music;
import com.patterns2learn.box.mediator.devices.Screen;
import com.patterns2learn.box.mediator.devices.WodTimer;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Buttons on the coach's tablet: each one talks to one device; the floor does the rest. */
@RestController
public class FloorController {
    public record FinishRequest(String athlete, int seconds) {}

    private final WodTimer timer;
    private final FinishLine finishLine;
    private final Screen screen;
    private final Music music;

    public FloorController(WodTimer timer, FinishLine finishLine, Screen screen, Music music) {
        this.timer = timer;
        this.finishLine = finishLine;
        this.screen = screen;
        this.music = music;
    }

    @PostMapping("/api/floor/start")
    public void start() {
        timer.start();
    }

    @PostMapping("/api/floor/finish")
    public void finish(@RequestBody FinishRequest req) {
        finishLine.finish(req.athlete(), req.seconds());
    }

    @PostMapping("/api/floor/cap")
    public void cap() {
        timer.cap();
    }

    @GetMapping("/api/floor/screen")
    public List<String> screen() {
        return screen.lines();
    }

    @GetMapping("/api/floor/music")
    public List<String> music() {
        return music.log();
    }
}
