package com.patterns2learn.box.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class PricingServiceTest {
    @Autowired PricingService service;
    @Test void springInjectsEveryStrategyByBeanName() {
        assertThat(service.plans()).containsExactlyInAnyOrder("monthly", "ten-pack", "drop-in", "student");
    }
    @Test void delegatesToTheStrategyNamedByThePlan() {
        assertThat(service.quote(new PricingRequest("ten-pack", 12))).isEqualTo(Money.eur("240.00"));
    }
    @Test void unknownPlanFailsWithClearMessage() {
        assertThatThrownBy(() -> service.quote(new PricingRequest("yoga", 1)))
            .isInstanceOf(UnknownPlanException.class).hasMessage("unknown plan: yoga");
    }
}
