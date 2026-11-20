package com.patterns2learn.box.visitor.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.visitor.Cardio;
import com.patterns2learn.box.visitor.Gymnastics;
import com.patterns2learn.box.visitor.Lift;
import java.util.List;
import org.junit.jupiter.api.Test;

class InstanceofAnalyzerTest {
    final InstanceofAnalyzer analyzer = new InstanceofAnalyzer();

    @Test void equipmentKnowsEveryType() {
        assertThat(analyzer.equipment(List.of(new Lift("deadlift", 100, 15), new Cardio("row", 1000))))
            .containsExactly("barbell + plates", "rower");
    }

    @Test void butCaloriesForgotCardioAndNobodyNoticed() {
        assertThat(analyzer.calories(List.of(new Cardio("row", 1000)))).isZero();   // should be 60
        assertThat(analyzer.calories(List.of(new Gymnastics("burpees", 30)))).isEqualTo(12);
    }
}
