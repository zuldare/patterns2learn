package com.patterns2learn.box.singleton.web;

import com.patterns2learn.box.singleton.Wod;
import com.patterns2learn.box.singleton.WodCatalog;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wods")
public class WodController {
    private final WodCatalog catalog;

    public WodController(WodCatalog catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public List<Wod> list() {
        return catalog.all();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Wod add(@RequestBody Wod wod) {
        catalog.add(wod);
        return wod;
    }
}
