package com.patterns2learn.box.decorator;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class MembershipTest {
    @Test void decoratorsStackAroundTheBasicPlan() {
        // @step:stacking
        Membership plan = new NutritionAddOn(new PhysioAddOn(new BasicMembership()));

        assertThat(plan.description()).isEqualTo("Basic + Physio + Nutrition");
        assertThat(plan.monthlyFee()).isEqualTo(Money.eur("99.00")); // 59 + 25 + 15
        // @end
    }

    @Test void theSameDecoratorCanBeReusedAnywhere() {
        assertThat(new OpenGymAddOn(new BasicMembership()).monthlyFee()).isEqualTo(Money.eur("69.00"));
    }

    @Test void orderMattersForDiscounts() {
        // @step:order-matters
        Membership discountLast = new StudentDiscount(new PhysioAddOn(new BasicMembership()));
        Membership discountFirst = new PhysioAddOn(new StudentDiscount(new BasicMembership()));

        assertThat(discountLast.monthlyFee()).isEqualTo(Money.eur("67.20"));  // (59 + 25) × 0.8
        assertThat(discountFirst.monthlyFee()).isEqualTo(Money.eur("72.20")); // 59 × 0.8 + 25
        // @end
    }
}
