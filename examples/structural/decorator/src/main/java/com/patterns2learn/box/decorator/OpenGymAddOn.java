package com.patterns2learn.box.decorator;

public class OpenGymAddOn extends MembershipDecorator {
    public OpenGymAddOn(Membership inner) {
        super(inner);
    }

    @Override
    public String description() {
        return inner.description() + " + Open gym";
    }

    @Override
    public Money monthlyFee() {
        return inner.monthlyFee().plus(Money.eur("10.00"));
    }
}
