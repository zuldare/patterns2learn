package com.patterns2learn.box.abstractfactory.web;

import com.patterns2learn.box.abstractfactory.WodCard;
import com.patterns2learn.box.abstractfactory.WodService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WodController {
    private final WodService wods;

    public WodController(WodService wods) {
        this.wods = wods;
    }

    @GetMapping("/api/wods/fran/score")
    public java.util.Map<String, String> score(@RequestParam(defaultValue = "rx") String division,
                                               @RequestParam int seconds, @RequestParam int reps) {
        return java.util.Map.of("score", wods.score(division, seconds, reps));
    }

    @GetMapping("/api/wods/fran")
    public WodCard fran(@RequestParam(defaultValue = "rx") String division) {
        return wods.fran(division);
    }
}
