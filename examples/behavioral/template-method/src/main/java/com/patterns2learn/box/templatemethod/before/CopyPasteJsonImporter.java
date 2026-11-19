package com.patterns2learn.box.templatemethod.before;

import com.patterns2learn.box.templatemethod.Result;
import com.patterns2learn.box.templatemethod.ResultRepository;

/** Before: the same import copied for the partner's JSON (rows already decoded to keep it short). */
public class CopyPasteJsonImporter {
    private final ResultRepository results;

    public CopyPasteJsonImporter(ResultRepository results) {
        this.results = results;
    }

    // @step:json-dup
    public int importAll(String[][] rows) {
        int saved = 0;
        for (String[] row : rows) {
            Result r = new Result(row[0], row[1], Integer.parseInt(row[2]));   // parse
            // validate? the score check was added to the CSV copy... and forgotten here
            results.save(r);                                                     // save
            saved++;
        }
        return saved;
    }
    // @end
}
