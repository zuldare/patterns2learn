package com.patterns2learn.box.decorator;

import org.springframework.stereotype.Component;

/** The plan everyone starts from: classes, coaching, the usual. */
@Component
public class BasicMembership implements Membership {
    @Override
    public String description() {
        return "Basic";
    }

    @Override
    public Money monthlyFee() {
        return Money.eur("59.00");
    }
}
