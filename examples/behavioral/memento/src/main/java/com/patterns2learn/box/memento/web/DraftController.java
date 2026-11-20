package com.patterns2learn.box.memento.web;

import com.patterns2learn.box.memento.DraftService;
import com.patterns2learn.box.memento.DraftService.DraftView;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DraftController {
    public record DraftRequest(String title, List<String> movements, int timeCapMinutes) {}

    private final DraftService drafts;

    public DraftController(DraftService drafts) {
        this.drafts = drafts;
    }

    @GetMapping("/api/draft")
    public DraftView get() {
        return drafts.view();
    }

    @PutMapping("/api/draft")
    public DraftView edit(@RequestBody DraftRequest req) {
        return drafts.edit(req.title(), req.movements(), req.timeCapMinutes());
    }

    @DeleteMapping("/api/draft")
    public DraftView clear() {
        return drafts.clear();
    }

    @PostMapping("/api/draft/undo")
    public DraftView undo() {
        return drafts.undo();
    }
}
