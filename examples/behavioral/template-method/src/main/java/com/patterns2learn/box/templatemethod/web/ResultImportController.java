package com.patterns2learn.box.templatemethod.web;

import com.patterns2learn.box.templatemethod.CsvResultImporter;
import com.patterns2learn.box.templatemethod.ImportReport;
import com.patterns2learn.box.templatemethod.JsonResultImporter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ResultImportController {
    private final CsvResultImporter csv;
    private final JsonResultImporter json;

    public ResultImportController(CsvResultImporter csv, JsonResultImporter json) {
        this.csv = csv;
        this.json = json;
    }

    // @step:endpoints
    @PostMapping(path = "/api/results/import", consumes = "text/csv")
    public ImportReport importCsv(@RequestBody String body) {
        return csv.importAll(body);   // same algorithm...
    }

    @PostMapping(path = "/api/results/import", consumes = "application/json")
    public ImportReport importJson(@RequestBody String body) {
        return json.importAll(body);  // ...different parse step
    }
    // @end

    /** The partner's app polls the report of its last push (204 until there is one). */
    @GetMapping("/api/results/import/partner/last")
    public ResponseEntity<ImportReport> lastPartnerReport() {
        ImportReport last = json.lastPartnerReport();
        return last == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(last);
    }
}
