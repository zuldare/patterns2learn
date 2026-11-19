package com.patterns2learn.box.templatemethod;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class ResultImporterTest {
    @Autowired CsvResultImporter csv;
    @Autowired JsonResultImporter json;
    @Autowired ResultRepository results;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager txManager;

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

    @Test void ordersByScoreThenAthlete() {
        csv.importAll("athlete,wod,score\nAna,Fran,185\nMia,Fran,170\nLeo,Fran,170\n");
        assertThat(results.findByWod("Fran")).extracting(Result::athlete).isEqualTo(List.of("Leo", "Mia", "Ana"));
    }

    @Test void wodIsRequiredAndNamesHaveAMaximumLength() {
        ImportReport report = csv.importAll("athlete,wod,score\nAna,,185\n" + "x".repeat(81) + ",Fran,190\n");
        assertThat(report.imported()).isZero();
        assertThat(report.rejected()).containsExactly("Ana/: wod is required", "x".repeat(81) + "/Fran: athlete is too long (max 80)");
    }

    @Test void csvNeedsItsHeader() {
        assertThatThrownBy(() -> csv.importAll("Ana,Fran,185\n"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("line 1: expected header athlete,wod,score");
    }

    @Test void jsonWithMissingOrFractionalScoreIsMalformed() {
        assertThatThrownBy(() -> json.importAll("[{\"athlete\":\"Ana\",\"wod\":\"Fran\"}]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> json.importAll("[{\"athlete\":\"Ana\",\"wod\":\"Fran\",\"score\":185.7}]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> json.importAll("null")).isInstanceOf(IllegalArgumentException.class).hasMessage("malformed JSON: expected an array of results");
    }

    @Test void anImportIsAllOrNothing() {
        // a repository that breaks on the second save, like a database hiccup halfway through
        var flaky = new ResultRepository(jdbc) {
            int saves;
            @Override public void save(Result r) {
                if (++saves == 2) throw new IllegalStateException("connection lost");
                super.save(r);
            }
        };
        var importer = new CsvResultImporter(flaky, txManager);
        assertThatThrownBy(() -> importer.importAll("athlete,wod,score\nAna,Fran,185\nMia,Fran,170\n"))
            .isInstanceOf(IllegalStateException.class);
        assertThat(Results.count(jdbc)).isZero(); // Ana's row was rolled back too
    }
}
