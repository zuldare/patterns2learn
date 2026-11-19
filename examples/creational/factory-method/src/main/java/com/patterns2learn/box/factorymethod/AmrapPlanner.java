package com.patterns2learn.box.factorymethod;

import org.springframework.stereotype.Component;

// @step:creator
@Component
public class AmrapPlanner extends WodPlanner {
    @Override
    public String format() {
        return "amrap";
    }

    @Override
    protected Workout createWorkout(WodRequest request) {
        return new Amrap(request.minutes(), request.movements());
    }
}
// @end
