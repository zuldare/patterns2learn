package com.patterns2learn.box.prototype.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.prototype.ProgramLibrary;
import com.patterns2learn.box.prototype.WeekProgram;
import java.util.List;
import org.junit.jupiter.api.Test;

class ShallowCopyServiceTest {
    @Test void aHandWrittenShallowCopyLetsTheNewWeekChangeTheOldOne() {
        WeekProgram lastWeek = new ProgramLibrary().newWeek("strength-block", "Week 46");
        WeekProgram week47 = new ShallowCopyService().duplicate(lastWeek, "Week 47");

        week47.day("Wed").replace(List.of("5x3 front squat"));

        assertThat(lastWeek.day("Wed").movements()).containsExactly("5x3 front squat");   // week 46 changed too
    }
}
