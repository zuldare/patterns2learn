package com.patterns2learn.box.observer.web;

import com.patterns2learn.box.observer.LeaderboardListener;
import com.patterns2learn.box.observer.LiftResult;
import com.patterns2learn.box.observer.ResultService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LiftController {
    private final ResultService results;
    private final LeaderboardListener leaderboard;

    public LiftController(ResultService results, LeaderboardListener leaderboard) {
        this.results = results;
        this.leaderboard = leaderboard;
    }

    @PostMapping("/api/lifts")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Boolean> record(@RequestBody LiftResult lift) {
        return Map.of("personalRecord", results.record(lift));
    }

    @GetMapping("/api/leaderboard")
    public Map<String, Integer> leaderboard(@RequestParam String lift) {
        return leaderboard.top(lift);
    }
}
