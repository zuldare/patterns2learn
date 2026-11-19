package com.patterns2learn.box.factorymethod;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class WodService {
    private final Map<String, WodPlanner> planners;

    // @step:pick
    public WodService(List<WodPlanner> planners) {
        // every WodPlanner bean, indexed by the format it handles
        this.planners = planners.stream().collect(Collectors.toMap(WodPlanner::format, Function.identity()));
    }

    public WodPlan plan(WodRequest request) {
        String format = request.format().strip().toLowerCase(Locale.ROOT);
        WodPlanner planner = planners.get(format);
        if (planner == null) {
            throw new IllegalArgumentException("unknown format: " + format);
        }
        return planner.plan(request);   // which Workout class gets built is the planner's call
    }
    // @end
}
