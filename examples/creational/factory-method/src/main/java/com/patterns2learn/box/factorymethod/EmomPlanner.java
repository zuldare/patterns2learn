package com.patterns2learn.box.factorymethod;

import org.springframework.stereotype.Component;

@Component
public class EmomPlanner extends WodPlanner {
    @Override
    public String format() {
        return "emom";
    }

    @Override
    protected Workout createWorkout(WodRequest request) {
        return new Emom(request.minutes(), request.movements());
    }
}
