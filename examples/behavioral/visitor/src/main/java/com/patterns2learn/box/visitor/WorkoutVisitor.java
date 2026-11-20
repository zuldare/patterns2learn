package com.patterns2learn.box.visitor;

// @step:visitor
/** The visitor: one method per kind of element. Each operation is one visitor; it accumulates, so one per walk. */
public interface WorkoutVisitor<R> {
    void visitLift(Lift lift);
    void visitGymnastics(Gymnastics gymnastics);
    void visitCardio(Cardio cardio);
    R result();
}
// @end
