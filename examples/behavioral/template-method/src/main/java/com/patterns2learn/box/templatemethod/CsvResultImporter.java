package com.patterns2learn.box.templatemethod;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;

@Component
public class CsvResultImporter extends ResultImporter {
    private static final String HEADER = "athlete,wod,score";

    public CsvResultImporter(ResultRepository results, PlatformTransactionManager txManager) {
        super(results, txManager);
    }

    // @step:csv-parse
    @Override
    protected List<Result> parse(String payload) {
        List<Result> rows = new ArrayList<>();
        String[] lines = payload.strip().split("\\R");
        requireHeader(lines[0]);
        for (int i = 1; i < lines.length; i++) {        // line 1 is the header
            String[] cols = lines[i].split(",", -1);   // simple CSV: no quoted commas in names
            if (cols.length != 3) {
                throw new IllegalArgumentException("line " + (i + 1) + ": expected athlete,wod,score");
            }
            rows.add(new Result(cols[0].strip(), cols[1].strip(), parseScore(cols[2], i + 1)));
        }
        return rows;
    }
    // @end

    private static void requireHeader(String first) {
        if (!first.strip().equalsIgnoreCase(HEADER)) {
            throw new IllegalArgumentException("line 1: expected header " + HEADER);
        }
    }

    private static int parseScore(String raw, int line) {
        try {
            return Integer.parseInt(raw.strip());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("line " + line + ": score must be a number");
        }
    }
}
