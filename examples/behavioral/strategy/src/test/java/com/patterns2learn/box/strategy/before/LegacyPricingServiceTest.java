package com.patterns2learn.box.strategy.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.strategy.Money;
import org.junit.jupiter.api.Test;

class LegacyPricingServiceTest {
    @Test void legacyMatchesTheNewPrices() {
        var legacy = new LegacyPricingService();
        assertThat(legacy.quote("monthly", 1)).isEqualTo(Money.eur("79.00"));
        assertThat(legacy.quote("ten-pack", 12)).isEqualTo(Money.eur("240.00"));
        assertThat(legacy.quote("drop-in", 3)).isEqualTo(Money.eur("45.00"));
    }
}
