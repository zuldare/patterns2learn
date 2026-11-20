package com.patterns2learn.box.visitor;

/** Another visitor, added without touching Lift, Gymnastics or Cardio: a rough estimate (the load is ignored). */
public class CalorieVisitor implements WorkoutVisitor<Integer> {
    private int calories;

    // @step:calories
    @Override public void visitLift(Lift lift) { calories += lift.reps() * 2; }
    @Override public void visitGymnastics(Gymnastics g) { calories += g.reps() * 2 / 5; }
    @Override public void visitCardio(Cardio c) { calories += c.meters() * 6 / 100; }
    // @end

    @Override public Integer result() {
        return calories;
    }
}
