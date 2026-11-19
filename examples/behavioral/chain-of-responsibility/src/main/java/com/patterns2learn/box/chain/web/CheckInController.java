package com.patterns2learn.box.chain.web;

import com.patterns2learn.box.chain.AccessControl;
import com.patterns2learn.box.chain.AccessDecision;
import com.patterns2learn.box.chain.CheckIn;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CheckInController {
    private final AccessControl access;

    public CheckInController(AccessControl access) {
        this.access = access;
    }

    @PostMapping("/api/check-ins")
    public ResponseEntity<AccessDecision> checkIn(@RequestParam String athlete, @RequestParam long session) {
        AccessDecision decision = access.decide(new CheckIn(athlete, session));
        return ResponseEntity.status(decision.granted() ? HttpStatus.OK : HttpStatus.FORBIDDEN).body(decision);
    }
}
