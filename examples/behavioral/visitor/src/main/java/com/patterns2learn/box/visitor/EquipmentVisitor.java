package com.patterns2learn.box.visitor;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** A concrete visitor: what equipment the coach has to set out. */
public class EquipmentVisitor implements WorkoutVisitor<List<String>> {
    private final Set<String> equipment = new LinkedHashSet<>();

    // @step:equipment
    @Override public void visitLift(Lift lift) {
        equipment.add("barbell + plates");
    }

    @Override public void visitGymnastics(Gymnastics g) {
        if (g.name().contains("pull-up") || g.name().contains("toes-to-bar")) equipment.add("pull-up bar");
    }

    @Override public void visitCardio(Cardio c) {
        switch (c.machine()) {
            case "row" -> equipment.add("rower");
            case "bike" -> equipment.add("assault bike");
            case "ski" -> equipment.add("ski erg");
            default -> { }                                  // running needs no machine
        }
    }
    // @end

    @Override public List<String> result() {
        return List.copyOf(equipment);
    }
}
