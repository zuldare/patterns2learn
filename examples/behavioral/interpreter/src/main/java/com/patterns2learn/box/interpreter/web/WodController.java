package com.patterns2learn.box.interpreter.web;

import com.patterns2learn.box.interpreter.Tally;
import com.patterns2learn.box.interpreter.WodParser;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WodController {
    public record WodRequest(String wod) {}
    public record Totals(Map<String, Integer> totals, int reps) {}

    private final WodParser parser;

    public WodController(WodParser parser) {
        this.parser = parser;
    }

    @PostMapping("/api/wods/totals")
    public Totals totals(@RequestBody WodRequest req) {
        Tally tally = new Tally();
        parser.parse(req.wod()).interpret(tally, 1);
        return new Totals(tally.totals(), tally.reps());
    }
}
