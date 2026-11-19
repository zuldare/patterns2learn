package com.patterns2learn.box.decorator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class MembershipQuoterTest {
    @Autowired MembershipQuoter quoter;

    @Test void wrapsTheBasicPlanWithTheRequestedAddOns() {
        Membership plan = quoter.quote(List.of("physio", "nutrition"));
        assertThat(plan.description()).isEqualTo("Basic + Physio + Nutrition");
        assertThat(plan.monthlyFee()).isEqualTo(Money.eur("99.00"));
    }

    @Test void theDiscountAlwaysGoesLastWhateverTheRequestOrder() {
        assertThat(quoter.quote(List.of("student", "physio")).monthlyFee()).isEqualTo(Money.eur("67.20"));
        assertThat(quoter.quote(List.of("physio", "student")).monthlyFee()).isEqualTo(Money.eur("67.20"));
    }

    @Test void noAddOnsIsTheBasicPlan() {
        assertThat(quoter.quote(List.of()).monthlyFee()).isEqualTo(Money.eur("59.00"));
    }

    @Test void unknownOrRepeatedAddOnsAreRejected() {
        assertThatThrownBy(() -> quoter.quote(List.of("sauna"))).isInstanceOf(IllegalArgumentException.class).hasMessage("unknown add-on: sauna");
        assertThatThrownBy(() -> quoter.quote(List.of("physio", "physio"))).isInstanceOf(IllegalArgumentException.class).hasMessage("repeated add-on: physio");
    }
}
