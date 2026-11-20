package com.patterns2learn.box.visitor;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/** The element: each kind of work accepts a visitor and calls the method meant for it. */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = Lift.class, name = "lift"),
    @JsonSubTypes.Type(value = Gymnastics.class, name = "gymnastics"),
    @JsonSubTypes.Type(value = Cardio.class, name = "cardio")})
public sealed interface WorkoutElement permits Lift, Gymnastics, Cardio {
    void accept(WorkoutVisitor<?> visitor);
}
