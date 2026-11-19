package com.patterns2learn.box.abstractfactory;

import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WodService {
    private final Map<String, DivisionKit> kits;
    private final FranPlanner planner;

    // @step:kits
    public WodService(Map<String, DivisionKit> kits, FranPlanner planner) {
        this.kits = Map.copyOf(kits);   // one per DivisionKit bean, by name: rx, scaled, teens
        this.planner = planner;
    }

    public WodCard fran(String division) {
        return planner.plan(kit(division));
    }

    private DivisionKit kit(String division) {
        String key = division == null || division.isBlank() ? "rx" : division.strip().toLowerCase(Locale.ROOT);
        DivisionKit kit = kits.get(key);
        if (kit == null) throw new UnknownDivisionException(abbreviate(key));
        return kit;
    }
    // @end

    public String score(String division, int seconds, int reps) {
        return planner.score(kit(division), seconds, reps);
    }

    private static String abbreviate(String s) {
        return s.length() <= 20 ? s : s.substring(0, 20) + "…";
    }
}
