package com.patterns2learn.box.chain;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AccessControl {
    private final List<AccessRule> rules;

    public AccessControl(List<AccessRule> rules) {
        this.rules = List.copyOf(rules);   // every AccessRule bean, sorted by @Order
    }

    public AccessDecision decide(CheckIn checkIn) {
        return new AccessChain(rules).proceed(checkIn);
    }
}
