package com.patterns2learn.box.factorymethod;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WodService {
    private final Map<String, WodPlanner> planners = new HashMap<>();

    // @step:pick
    public WodService(List<WodPlanner> planners) {
        // every WodPlanner bean, indexed by the format it handles
        for (WodPlanner p : planners) {
            if (this.planners.putIfAbsent(p.format().toLowerCase(Locale.ROOT), p) != null) {
                throw new IllegalStateException("two planners for format: " + p.format());
            }
        }
    }

    public WodPlan plan(WodRequest request) {
        String asked = request.format().strip();
        WodPlanner planner = planners.get(asked.toLowerCase(Locale.ROOT));
        if (planner == null) {
            throw new IllegalArgumentException("unknown format: " + abbreviate(asked));
        }
        return planner.plan(request);   // which Workout class gets built is the planner's call
    }
    // @end

    private static String abbreviate(String s) {
        return s.length() <= 40 ? s : s.substring(0, 40) + "…";
    }
}
