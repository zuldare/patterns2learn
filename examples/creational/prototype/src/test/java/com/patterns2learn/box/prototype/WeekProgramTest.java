package com.patterns2learn.box.prototype;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class WeekProgramTest {
    final ProgramLibrary library = new ProgramLibrary();

    @Test void aCopyIsDeepEditingItLeavesTheOriginalAlone() {
        // @step:deep
        WeekProgram template = library.template("strength-block");
        WeekProgram week47 = library.newWeek("strength-block", "Week 47");

        week47.day("Wed").replace(List.of("5x3 front squat", "EMOM 10' cleans"));

        assertThat(template.day("Wed").movements()).containsExactly("5x5 back squat", "3 rounds Helen");
        // @end
        assertThat(week47.name()).isEqualTo("Week 47");
        assertThat(week47.day("Mon").movements()).isEqualTo(template.day("Mon").movements());
        assertThat(week47.day("Mon")).isNotSameAs(template.day("Mon"));
    }

    @Test void theLibraryNeverHandsOutItsPrototypes() {
        WeekProgram first = library.template("deload-week");
        first.rename("hacked");
        first.day("Mon").replace(List.of("nothing"));
        assertThat(library.template("deload-week").name()).isEqualTo("Deload week");
        assertThat(library.template("deload-week").day("Mon").movements()).containsExactly("20' easy row", "mobility");
    }

    @Test void unknownTemplatesAndDaysAreRejected() {
        assertThatThrownBy(() -> library.newWeek("zen-week", "W")).isInstanceOf(UnknownTemplateException.class).hasMessage("unknown template: zen-week");
        assertThatThrownBy(() -> library.newWeek("strength-block", "W").day("Sun")).isInstanceOf(UnknownDayException.class).hasMessage("no plan for Sun");
        assertThat(library.names()).containsExactly("deload-week", "strength-block");
    }

    @Test void structureIsValidated() {
        assertThatThrownBy(() -> new WeekProgram("W", null)).hasMessage("a week needs 1 to 7 days");
        assertThatThrownBy(() -> new WeekProgram("W", List.of(new DayPlan("Mon", List.of("a")), new DayPlan("mon", List.of("b")))))
            .hasMessage("each day can appear only once");
        assertThatThrownBy(() -> new DayPlan(" ", List.of("a"))).hasMessage("day is required");
        assertThatThrownBy(() -> new ProgramLibrary().newWeek("strength-block", "W").day(null)).hasMessage("no plan for ");
    }

    @Test void plansAreValidated() {
        WeekProgram w = library.newWeek("strength-block", "W");
        assertThatThrownBy(() -> w.rename(" ")).isInstanceOf(InvalidProgramException.class).hasMessage("name is required");
        assertThatThrownBy(() -> w.rename("x".repeat(41))).hasMessage("name is at most 40 characters");
        assertThatThrownBy(() -> w.day("Wed").replace(List.of())).hasMessage("a day needs 1 to 12 movements");
        assertThatThrownBy(() -> w.day("Wed").replace(java.util.Arrays.asList("ok", " "))).hasMessage("movements cannot be blank");
        assertThatThrownBy(() -> w.day("Wed").replace(List.of("x".repeat(61)))).hasMessage("a movement is at most 60 characters");
    }
}
