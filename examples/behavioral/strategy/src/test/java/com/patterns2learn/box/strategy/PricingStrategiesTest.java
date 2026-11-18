package com.patterns2learn.box.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PricingStrategiesTest {
    @Test void monthlyIsFlat() {
        assertThat(new MonthlyPricing().priceFor(new PricingRequest("monthly", 1))).isEqualTo(Money.eur("79.00"));
        assertThat(new MonthlyPricing().priceFor(new PricingRequest("monthly", 30))).isEqualTo(Money.eur("79.00"));
    }
    @Test void tenPackChargesPerBlockOfTenRoundingUp() {
        var s = new TenPackPricing();
        assertThat(s.priceFor(new PricingRequest("ten-pack", 1))).isEqualTo(Money.eur("120.00"));
        assertThat(s.priceFor(new PricingRequest("ten-pack", 10))).isEqualTo(Money.eur("120.00"));
        assertThat(s.priceFor(new PricingRequest("ten-pack", 12))).isEqualTo(Money.eur("240.00"));
    }
    @Test void dropInChargesPerSession() {
        assertThat(new DropInPricing().priceFor(new PricingRequest("drop-in", 3))).isEqualTo(Money.eur("45.00"));
    }
    @Test void studentGetsTwentyPercentOffMonthly() {
        assertThat(new StudentPricing().priceFor(new PricingRequest("student", 1))).isEqualTo(Money.eur("63.20"));
    }
    @Test void sessionsBelowOneAreRejected() {
        assertThatThrownBy(() -> new PricingRequest("monthly", 0)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void moneyEqualityIgnoresInputScale() {
        assertThat(new Money(new BigDecimal("79"))).isEqualTo(Money.eur("79.00"));
    }
}
