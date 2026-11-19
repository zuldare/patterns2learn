package com.patterns2learn.box.templatemethod;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Template Method: the import algorithm is fixed here; subclasses only fill in the steps that vary. */
public abstract class ResultImporter {
    private final ResultRepository results;

    protected ResultImporter(ResultRepository results) {
        this.results = results;
    }

    // @step:template
    public final ImportReport importAll(String payload) {
        List<Result> parsed = parse(payload);        // 1. varies: CSV, JSON...
        int imported = 0;
        List<String> rejected = new ArrayList<>();
        for (Result r : parsed) {
            Optional<String> problem = validate(r);   // 2. shared rule, written once
            if (problem.isPresent()) {
                rejected.add(r.athlete() + "/" + r.wod() + ": " + problem.get());
                continue;
            }
            results.save(r);                          // 3. shared
            imported++;
        }
        ImportReport report = new ImportReport(imported, rejected);
        afterImport(report);                          // 4. hook: optional extra step
        return report;
    }

    protected abstract List<Result> parse(String payload);

    protected void afterImport(ImportReport report) {
        // hook: does nothing unless a subclass needs it
    }
    // @end

    private static Optional<String> validate(Result r) {
        if (r.athlete() == null || r.athlete().isBlank()) {
            return Optional.of("athlete is required");
        }
        if (r.score() <= 0) {
            return Optional.of("score must be > 0");
        }
        return Optional.empty();
    }
}
