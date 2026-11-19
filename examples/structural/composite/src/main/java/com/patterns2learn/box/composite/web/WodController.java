package com.patterns2learn.box.composite.web;

import com.patterns2learn.box.composite.UnknownWodException;
import com.patterns2learn.box.composite.WodLibrary;
import com.patterns2learn.box.composite.WodSummary;
import com.patterns2learn.box.composite.WorkoutPart;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WodController {
    private final WodLibrary library;

    public WodController(WodLibrary library) {
        this.library = library;
    }

    @GetMapping("/api/wods/{name}")
    public WodSummary benchmark(@PathVariable String name) {
        return WodSummary.of(library.find(name).orElseThrow(() -> new UnknownWodException(abbreviate(name))));
    }

    /** Any tree the coach sends: Jackson builds the parts from "type", the composite does the rest. */
    @PostMapping("/api/wods/estimate")
    public WodSummary estimate(@RequestBody WorkoutPart wod) {
        return WodSummary.of(wod);
    }

    private static String abbreviate(String s) {
        String t = s.strip();
        return t.length() <= 40 ? t : t.substring(0, 40) + "…";
    }
}
