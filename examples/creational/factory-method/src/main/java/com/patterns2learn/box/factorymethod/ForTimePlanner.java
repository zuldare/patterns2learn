package com.patterns2learn.box.factorymethod;

import org.springframework.stereotype.Component;

@Component
public class ForTimePlanner extends WodPlanner {
    @Override
    public String format() {
        return "for-time";
    }

    // @step:for-time
    @Override
    protected Workout createWorkout(WodRequest request) {
        // here "minutes" means the time cap: only this creator knows that
        return new ForTime(request.minutes(), request.movements());
    }
    // @end
}
