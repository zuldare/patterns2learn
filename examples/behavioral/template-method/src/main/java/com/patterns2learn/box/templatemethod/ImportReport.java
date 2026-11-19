package com.patterns2learn.box.templatemethod;

import java.util.List;

/** What an import did: how many rows were saved and why the others were rejected. */
public record ImportReport(int imported, List<String> rejected) {
    public ImportReport {
        rejected = List.copyOf(rejected);
    }
}
