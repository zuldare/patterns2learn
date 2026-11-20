package com.patterns2learn.box.flyweight;

import java.util.List;
import java.util.Map;

/** Raw movement data, as it would come from a table or a file (in a real box, with videos and longer standards). */
final class MovementDefinitions {
    private MovementDefinitions() {}

    record Row(String category, String standard, List<String> equipment) {}

    static final Map<String, Row> ROWS = Map.of(
        "back squat", new Row("weightlifting",
            "Bar on the back, hip crease below the top of the knee at the bottom, full hip and knee extension at the top.",
            List.of("barbell", "rack")),
        "deadlift", new Row("weightlifting",
            "Bar starts on the floor, finishes with hips and knees fully extended and shoulders behind the bar.",
            List.of("barbell")),
        "thruster", new Row("weightlifting",
            "Front squat below parallel straight into a press, finishing with arms locked out overhead.",
            List.of("barbell")),
        "pull-up", new Row("gymnastics",
            "From a dead hang with arms extended, chin clearly over the bar; any grip, kipping allowed.",
            List.of("pull-up bar")));
}
