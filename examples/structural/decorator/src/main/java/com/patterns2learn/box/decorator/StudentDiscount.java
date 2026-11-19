package com.patterns2learn.box.decorator;

/** Not an add-on but the same shape: 20% off whatever it wraps. */
public class StudentDiscount extends MembershipDecorator {
    public StudentDiscount(Membership inner) {
        super(inner);
    }

    @Override
    public String description() {
        return inner.description() + " (student −20%)";
    }

    @Override
    public Money monthlyFee() {
        return inner.monthlyFee().times("0.8");
    }
}
