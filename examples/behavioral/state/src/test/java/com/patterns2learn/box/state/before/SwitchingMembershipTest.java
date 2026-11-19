package com.patterns2learn.box.state.before;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SwitchingMembershipTest {
    @Test void itWorksButEveryMethodSwitchesOnTheStatus() {
        SwitchingMembership ana = new SwitchingMembership("active");
        ana.freeze();
        assertThat(ana.status()).isEqualTo("frozen");
        assertThatThrownBy(ana::checkIn).hasMessage("membership is frozen: resume it first");
        ana.resume();
        ana.checkIn();
    }

    @Test void aTypoInAStatusIsOnlyFoundAtRuntime() {
        SwitchingMembership typo = new SwitchingMembership("activ");
        assertThatThrownBy(typo::checkIn).isInstanceOf(IllegalStateException.class).hasMessage("unknown status: activ");
    }
}
