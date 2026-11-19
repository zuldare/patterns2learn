package com.patterns2learn.box.templatemethod;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Template Method: the import algorithm is fixed here; subclasses only fill in the steps that vary. */
public abstract class ResultImporter {
    private static final int MAX_NAME = 80;

    private final ResultRepository results;
    private final TransactionTemplate tx;

    protected ResultImporter(ResultRepository results, PlatformTransactionManager txManager) {
        this.results = results;
        this.tx = new TransactionTemplate(txManager);
    }

    // @step:template
    public final ImportReport importAll(String payload) {
        List<Result> parsed = parse(payload);              // 1. varies: CSV, JSON...
        ImportReport report = tx.execute(status -> {       // all rows or none
            int imported = 0;
            List<String> rejected = new ArrayList<>();
            for (Result r : parsed) {
                Optional<String> problem = validate(r);     // 2. shared rule, written once
                if (problem.isPresent()) {
                    rejected.add(r.athlete() + "/" + r.wod() + ": " + problem.get());
                    continue;
                }
                results.save(r);                            // 3. shared
                imported++;
            }
            return new ImportReport(imported, rejected);
        });
        afterImport(report);                                // 4. hook: optional extra step
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
        if (r.athlete().length() > MAX_NAME) {
            return Optional.of("athlete is too long (max " + MAX_NAME + ")");
        }
        if (r.wod() == null || r.wod().isBlank()) {
            return Optional.of("wod is required");
        }
        if (r.wod().length() > MAX_NAME) {
            return Optional.of("wod is too long (max " + MAX_NAME + ")");
        }
        if (r.score() <= 0) {
            return Optional.of("score must be > 0");
        }
        return Optional.empty();
    }
}
