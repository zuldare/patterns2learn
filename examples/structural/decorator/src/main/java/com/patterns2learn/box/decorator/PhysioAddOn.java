package com.patterns2learn.box.decorator;

// @step:physio
public class PhysioAddOn extends MembershipDecorator {
    public PhysioAddOn(Membership inner) {
        super(inner);
    }

    @Override
    public String description() {
        return inner.description() + " + Physio";        // what's inside, plus my bit
    }

    @Override
    public Money monthlyFee() {
        return inner.monthlyFee().plus(Money.eur("25.00"));
    }
}
// @end
