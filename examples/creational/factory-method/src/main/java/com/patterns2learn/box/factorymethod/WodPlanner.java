package com.patterns2learn.box.factorymethod;

/** The creator: knows how to plan a WOD, but leaves "which Workout class" to its subclasses. */
public abstract class WodPlanner {
    /** The format this planner handles, e.g. "amrap". */
    public abstract String format();

    // @step:factory-method
    public final WodPlan plan(WodRequest request) {
        Workout workout = createWorkout(request);   // the factory method: the subclass picks the class
        return new WodPlan(request.name(), format(), workout.summary(), workout.scoreUnit(), workout.lowerIsBetter());
    }

    protected abstract Workout createWorkout(WodRequest request);
    // @end
}
