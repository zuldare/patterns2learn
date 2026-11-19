package com.patterns2learn.box.templatemethod.before;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.templatemethod.ResultRepository;
import com.patterns2learn.box.templatemethod.Results;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class DuplicatedImportersTest {
    @Autowired ResultRepository results;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach void clear() {
        Results.clear(jdbc);
    }

    @Test void theCsvCopyGotTheFixButTheJsonCopyDidNot() {
        int csvSaved = new CopyPasteCsvImporter(results).importAll("athlete,wod,score\nAna,Fran,0\n");
        assertThat(csvSaved).isZero(); // CSV checks the score

        // JSON forgot the rule: only the database CHECK constraint stops the bad row, with a 500-style error
        assertThatThrownBy(() -> new CopyPasteJsonImporter(results).importAll(new String[][] {{"Ana", "Fran", "0"}}))
            .isInstanceOf(DataIntegrityViolationException.class);
    }
}
