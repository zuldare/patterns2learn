package com.patterns2learn.box.factorymethod.web;

import com.patterns2learn.box.factorymethod.WodPlan;
import com.patterns2learn.box.factorymethod.WodRequest;
import com.patterns2learn.box.factorymethod.WodService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WodController {
    private final WodService wods;

    public WodController(WodService wods) {
        this.wods = wods;
    }

    @PostMapping("/api/wods/plan")
    public WodPlan plan(@RequestBody WodRequest request) {
        return wods.plan(request);
    }
}
