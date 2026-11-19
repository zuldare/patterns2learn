package com.patterns2learn.box.templatemethod.before;

import com.patterns2learn.box.templatemethod.Result;
import com.patterns2learn.box.templatemethod.ResultRepository;

/** Before: the whole import, start to finish, written for CSV. */
public class CopyPasteCsvImporter {
    private final ResultRepository results;

    public CopyPasteCsvImporter(ResultRepository results) {
        this.results = results;
    }

    // @step:csv-dup
    public int importAll(String csv) {
        int saved = 0;
        String[] lines = csv.strip().split("\\R");
        for (int i = 1; i < lines.length; i++) {
            String[] cols = lines[i].split(",");                      // parse
            Result r = new Result(cols[0], cols[1], Integer.parseInt(cols[2].strip()));
            if (r.athlete().isBlank() || r.score() <= 0) {             // validate
                continue;
            }
            results.save(r);                                            // save
            saved++;
        }
        return saved;
    }
    // @end
}
