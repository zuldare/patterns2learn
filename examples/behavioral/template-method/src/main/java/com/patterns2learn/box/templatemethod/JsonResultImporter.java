package com.patterns2learn.box.templatemethod;

import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/** Results pushed by the partner app as JSON. */
@Component
public class JsonResultImporter extends ResultImporter {
    private final JsonMapper json;
    private volatile ImportReport lastPartnerReport;

    public JsonResultImporter(ResultRepository results, PlatformTransactionManager txManager, JsonMapper bootMapper) {
        super(results, txManager);
        // Boot's mapper, stricter: a missing or fractional score is an error, never a silent 0 or a truncation
        this.json = bootMapper.rebuild()
            .enable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, DeserializationFeature.FAIL_ON_MISSING_CREATOR_PROPERTIES)
            .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
            .build();
    }

    @Override
    protected List<Result> parse(String payload) {
        List<Result> rows;
        try {
            rows = json.readValue(payload, new TypeReference<List<Result>>() {});
        } catch (JacksonException e) {
            throw new IllegalArgumentException("malformed JSON: " + e.getOriginalMessage());
        }
        if (rows == null) {
            throw new IllegalArgumentException("malformed JSON: expected an array of results");
        }
        return rows;
    }

    // @step:hook
    @Override
    protected void afterImport(ImportReport report) {
        // only the partner integration needs this: keep the last report so its app can poll it
        lastPartnerReport = report;
    }
    // @end

    public ImportReport lastPartnerReport() {
        return lastPartnerReport;
    }
}
