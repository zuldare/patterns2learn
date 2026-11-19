package com.patterns2learn.box.decorator;

public class NutritionAddOn extends MembershipDecorator {
    public NutritionAddOn(Membership inner) {
        super(inner);
    }

    @Override
    public String description() {
        return inner.description() + " + Nutrition";
    }

    @Override
    public Money monthlyFee() {
        return inner.monthlyFee().plus(Money.eur("15.00"));
    }
}
