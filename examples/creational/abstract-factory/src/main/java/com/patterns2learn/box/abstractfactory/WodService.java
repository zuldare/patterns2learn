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
        this.kits = Map.copyOf(kits);           // every DivisionKit bean, keyed by its bean name: rx, scaled, teens
        this.planner = planner;
    }

    public WodCard fran(String division) {
        String key = division == null ? "" : division.strip().toLowerCase(Locale.ROOT);
        DivisionKit kit = kits.get(key);
        if (kit == null) throw new UnknownDivisionException(abbreviate(key));
        return planner.plan(kit);
    }
    // @end

    private static String abbreviate(String s) {
        return s.length() <= 20 ? s : s.substring(0, 20) + "…";
    }
}
