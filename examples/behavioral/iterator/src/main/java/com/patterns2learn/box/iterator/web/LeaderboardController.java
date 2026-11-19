package com.patterns2learn.box.iterator.web;

import com.patterns2learn.box.iterator.Leaderboard;
import com.patterns2learn.box.iterator.Placing;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LeaderboardController {
    private final Leaderboard leaderboard;

    public LeaderboardController(Leaderboard leaderboard) {
        this.leaderboard = leaderboard;
    }

    @GetMapping("/api/leaderboard/{wod}")
    public List<Placing> top(@PathVariable String wod, @RequestParam(defaultValue = "10") int top) {
        return leaderboard.top(wod, top);
    }
}
