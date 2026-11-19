package com.patterns2learn.box.templatemethod;

import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Results pushed by the partner app as JSON. */
@Component
public class JsonResultImporter extends ResultImporter {
    private final JsonMapper json = JsonMapper.builder().build();
    private volatile ImportReport lastPartnerReport;

    public JsonResultImporter(ResultRepository results) {
        super(results);
    }

    @Override
    protected List<Result> parse(String payload) {
        try {
            return json.readValue(payload, new TypeReference<List<Result>>() {});
        } catch (JacksonException e) {
            throw new IllegalArgumentException("malformed JSON: " + e.getOriginalMessage());
        }
    }

    // @step:hook
    @Override
    protected void afterImport(ImportReport report) {
        // only the partner integration needs this: keep the last report so it can be polled
        lastPartnerReport = report;
    }
    // @end

    public ImportReport lastPartnerReport() {
        return lastPartnerReport;
    }
}
