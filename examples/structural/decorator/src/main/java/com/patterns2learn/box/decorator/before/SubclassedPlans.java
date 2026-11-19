package com.patterns2learn.box.decorator.before;

import com.patterns2learn.box.decorator.Money;

/** Before: one class per combination of extras. Two extras already need four classes. */
public final class SubclassedPlans {
    private SubclassedPlans() {}

    public static class Basic {
        public Money monthlyFee() { return Money.eur("59.00"); }
    }

    public static class BasicWithPhysio extends Basic {
        @Override public Money monthlyFee() { return Money.eur("84.00"); }
    }

    // @step:explosion
    public static class BasicWithNutrition extends Basic {
        @Override public Money monthlyFee() { return Money.eur("74.00"); }
    }

    public static class BasicWithPhysioAndNutrition extends Basic {
        // the price of each extra is copied here again, by hand: 59 + 25 + 15
        @Override public Money monthlyFee() { return Money.eur("99.00"); }
    }
    // @end
}
