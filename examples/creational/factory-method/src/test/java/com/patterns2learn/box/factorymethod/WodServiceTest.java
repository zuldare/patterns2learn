package com.patterns2learn.box.factorymethod;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class WodServiceTest {
    @Autowired WodService wods;

    @Test void anAmrapPlan() {
        // @step:plan-request
        WodPlan plan = wods.plan(new WodRequest("Cindy", "amrap", 20, List.of("5 pull-ups", "10 push-ups", "15 air squats")));

        assertThat(plan.summary()).isEqualTo("AMRAP 20': 5 pull-ups, 10 push-ups, 15 air squats");
        assertThat(plan.scoreUnit()).isEqualTo("rounds + reps");
        assertThat(plan.lowerIsBetter()).isFalse();
        // @end
    }

    @Test void anEmomPlan() {
        WodPlan plan = wods.plan(new WodRequest("Clean ladder", "emom", 10, List.of("3 power cleans")));
        assertThat(plan.summary()).isEqualTo("EMOM 10': 3 power cleans");
        assertThat(plan.scoreUnit()).isEqualTo("completed minutes");
        assertThat(plan.lowerIsBetter()).isFalse();
    }

    @Test void aForTimePlanHasACapAndLowerIsBetter() {
        WodPlan plan = wods.plan(new WodRequest("Fran", "for-time", 8, List.of("21-15-9 thrusters", "pull-ups")));
        assertThat(plan.summary()).isEqualTo("For time (cap 8'): 21-15-9 thrusters, pull-ups");
        assertThat(plan.scoreUnit()).isEqualTo("seconds (reps if you hit the cap)");
        assertThat(plan.lowerIsBetter()).isTrue();
    }

    @Test void formatsAreCaseInsensitiveAndUnknownOnesAreRejected() {
        assertThat(wods.plan(new WodRequest("Cindy", "AMRAP", 20, List.of("burpees"))).format()).isEqualTo("amrap");
        assertThatThrownBy(() -> wods.plan(new WodRequest("Yoga", "zen", 30, List.of("breathe"))))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("unknown format: zen");
        assertThatThrownBy(() -> wods.plan(new WodRequest("Yoga", " Zen ", 30, List.of("breathe"))))
            .hasMessage("unknown format: Zen");
    }

    @Test void requestsAreValidated() {
        assertThatThrownBy(() -> new WodRequest(" ", "amrap", 20, List.of("burpees"))).hasMessage("name is required");
        assertThatThrownBy(() -> new WodRequest("Cindy", "amrap", 0, List.of("burpees"))).hasMessage("minutes must be between 1 and 90");
        assertThatThrownBy(() -> new WodRequest("Cindy", "amrap", 91, List.of("burpees"))).hasMessage("minutes must be between 1 and 90");
        assertThat(new WodRequest("Murph", "for-time", 70, List.of("1 mile run")).minutes()).isEqualTo(70);
        assertThatThrownBy(() -> new WodRequest("Cindy", "amrap", 20, List.of("burpees", " "))).hasMessage("movements cannot be blank");
        assertThatThrownBy(() -> new WodRequest("Cindy", "amrap", 20, java.util.Arrays.asList("burpees", null))).hasMessage("movements cannot be blank");
        assertThatThrownBy(() -> new WodRequest("Cindy", "amrap", 20, java.util.Collections.nCopies(21, "burpees"))).hasMessage("at most 20 movements");
        assertThatThrownBy(() -> new WodRequest("Cindy", "amrap", 20, List.of())).hasMessage("at least one movement is required");
    }

    @Test void twoPlannersForTheSameFormatFailFastWithAClearMessage() {
        assertThatThrownBy(() -> new WodService(List.of(new AmrapPlanner(), new AmrapPlanner())))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("two planners for format: amrap");
    }
}
