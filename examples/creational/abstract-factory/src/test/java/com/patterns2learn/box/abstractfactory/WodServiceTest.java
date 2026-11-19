package com.patterns2learn.box.abstractfactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import org.junit.jupiter.api.Test;

class WodServiceTest {
    final WodService service = new WodService(Map.of("rx", new RxKit(), "scaled", new ScaledKit()), new FranPlanner());

    @Test void picksTheKitByDivisionIgnoringCaseAndSpaces() {
        assertThat(service.fran(" SCALED ").title()).isEqualTo("Fran · Scaled");
    }

    @Test void unknownDivisionsAreRejectedAndBlankMeansRx() {
        assertThatThrownBy(() -> service.fran("masters")).isInstanceOf(UnknownDivisionException.class).hasMessage("unknown division: masters");
        assertThat(service.fran(null).title()).isEqualTo("Fran · Rx");
        assertThat(service.fran("  ").title()).isEqualTo("Fran · Rx");   // blank means "no division": the default
    }
}
