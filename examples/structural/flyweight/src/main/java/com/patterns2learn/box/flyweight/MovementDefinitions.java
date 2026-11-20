package com.patterns2learn.box.flyweight;

import java.util.List;
import java.util.Map;

/** Where the movement data comes from (in a real box, a table or a file with videos and long standards). */
final class MovementDefinitions {
    private MovementDefinitions() {}

    static final Map<String, Movement> ALL = Map.of(
        "back squat", new Movement("back squat", "weightlifting",
            "Bar on the back, hip crease below the top of the knee at the bottom, full hip and knee extension at the top.",
            List.of("barbell", "rack")),
        "deadlift", new Movement("deadlift", "weightlifting",
            "Bar starts on the floor, finishes with hips and knees fully extended and shoulders behind the bar.",
            List.of("barbell")),
        "thruster", new Movement("thruster", "weightlifting",
            "Front squat below parallel straight into a press, finishing with arms locked out overhead.",
            List.of("barbell")),
        "pull-up", new Movement("pull-up", "gymnastics",
            "From a dead hang with arms extended, chin clearly over the bar; any grip, kipping allowed.",
            List.of("pull-up bar")));
}
