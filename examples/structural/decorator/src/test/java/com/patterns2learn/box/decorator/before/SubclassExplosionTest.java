package com.patterns2learn.box.decorator.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.decorator.Money;
import org.junit.jupiter.api.Test;

class SubclassExplosionTest {
    @Test void everyCombinationIsItsOwnClass() {
        assertThat(new SubclassedPlans.BasicWithPhysioAndNutrition().monthlyFee()).isEqualTo(Money.eur("99.00"));
        assertThat(SubclassedPlans.class.getDeclaredClasses()).hasSize(4); // 2 add-ons → 4 classes; 3 → 8; 4 → 16
    }
}
