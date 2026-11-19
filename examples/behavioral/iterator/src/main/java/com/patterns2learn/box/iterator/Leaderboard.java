package com.patterns2learn.box.iterator;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;

/** The client: walks the results with a plain for-each and stops when it has enough. */
@Service
public class Leaderboard {
    private final ResultHistory history;

    public Leaderboard(ResultHistory history) {
        this.history = history;
    }

    // @step:client
    public List<Placing> top(String wod, int n) {
        if (n < 1 || n > 100) throw new InvalidLimitException();
        List<Placing> podium = new ArrayList<>();
        Set<String> placed = new HashSet<>();
        for (Result r : history.fastest(wod.toLowerCase(Locale.ROOT))) {   // no pages, no SQL
            if (!placed.add(r.athlete())) continue;                         // each athlete once: their best
            podium.add(Placing.of(podium.size() + 1, r));
            if (podium.size() == n) break;                                  // stop when there are enough
        }
        return podium;
    }
    // @end
}
