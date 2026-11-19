package com.patterns2learn.box.composite;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.List;

// @step:component
/** The component: anything that can go on the board, from one movement to a whole WOD. */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = Movement.class, name = "movement"),
    @JsonSubTypes.Type(value = Run.class, name = "run"),
    @JsonSubTypes.Type(value = Block.class, name = "block")})
public interface WorkoutPart {
    int reps();             // total reps of the strength work
    int seconds();          // estimated time
    List<String> lines();   // how it reads on the board

    default int depth() {   // how many blocks deep (a leaf is 0)
        return 0;
    }
}
// @end
