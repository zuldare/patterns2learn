package com.patterns2learn.box.templatemethod;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class ResultImporterTest {
    @Autowired CsvResultImporter csv;
    @Autowired JsonResultImporter json;
    @Autowired ResultRepository results;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach void clear() {
        Results.clear(jdbc);
    }

    @Test void csvGoesThroughTheSharedSteps() {
        // @step:import-report
        ImportReport report = csv.importAll("""
            athlete,wod,score
            Ana,Fran,185
            Leo,Fran,0
            Mia,Cindy,21
            """);

        // the shared validation step rejected Leo's 0 for both formats alike
        assertThat(report.imported()).isEqualTo(2);
        assertThat(report.rejected()).containsExactly("Leo/Fran: score must be > 0");
        // @end
        assertThat(results.findByWod("Fran")).containsExactly(new Result("Ana", "Fran", 185));
    }

    @Test void jsonGetsTheSameRulesForFree() {
        ImportReport report = json.importAll("""
            [{"athlete":"Ana","wod":"Fran","score":-5},{"athlete":" ","wod":"Fran","score":200},{"athlete":"Mia","wod":"Fran","score":190}]
            """);
        assertThat(report.imported()).isEqualTo(1);
        assertThat(report.rejected()).containsExactly("Ana/Fran: score must be > 0", " /Fran: athlete is required");
        assertThat(json.lastPartnerReport()).isEqualTo(report); // the hook ran
    }

    @Test void malformedCsvLineIsReportedWithItsNumber() {
        assertThatThrownBy(() -> csv.importAll("athlete,wod,score\nAna,Fran\n"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("line 2: expected athlete,wod,score");
        assertThat(Results.count(jdbc)).isZero();
    }

    @Test void malformedJsonIs400Material() {
        assertThatThrownBy(() -> json.importAll("[{"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageStartingWith("malformed JSON");
    }

    @Test void ordersByScoreAscendingWhichIsBestFirstForTimedWods() {
        csv.importAll("athlete,wod,score\nAna,Fran,185\nMia,Fran,170\n");
        assertThat(results.findByWod("Fran")).extracting(Result::athlete).isEqualTo(List.of("Mia", "Ana"));
    }
}
