package com.patterns2learn.box.state.web;

import com.patterns2learn.box.state.MembershipService;
import com.patterns2learn.box.state.MembershipView;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MembershipController {
    private final MembershipService memberships;

    public MembershipController(MembershipService memberships) {
        this.memberships = memberships;
    }

    @GetMapping("/api/memberships/{id}")
    public MembershipView find(@PathVariable int id) {
        return memberships.find(id);
    }

    /** check-in, freeze, resume, renew or expire. */
    @PostMapping("/api/memberships/{id}/{action}")
    public MembershipView apply(@PathVariable int id, @PathVariable String action) {
        return memberships.apply(id, action);
    }
}
