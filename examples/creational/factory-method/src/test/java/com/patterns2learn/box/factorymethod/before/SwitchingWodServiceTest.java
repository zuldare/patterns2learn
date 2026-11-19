package com.patterns2learn.box.factorymethod.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.factorymethod.WodRequest;
import java.util.List;
import org.junit.jupiter.api.Test;

class SwitchingWodServiceTest {
    @Test void itWorksButEveryFormatLivesInTwoSwitches() {
        var service = new SwitchingWodService();
        var plan = service.plan(new WodRequest("Cindy", "amrap", 20, List.of("5 pull-ups")));
        assertThat(plan.summary()).isEqualTo("AMRAP 20': 5 pull-ups");
        assertThat(plan.scoreUnit()).isEqualTo("rounds + reps");
    }
}
