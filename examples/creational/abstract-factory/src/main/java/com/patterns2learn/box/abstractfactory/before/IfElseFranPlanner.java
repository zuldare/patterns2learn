package com.patterns2learn.box.abstractfactory.before;

import java.util.List;

/** Before: every piece of the card decides the division on its own. */
public class IfElseFranPlanner {
    // @step:if-else
    public List<String> plan(String division) {
        int kg;
        if (division.equalsIgnoreCase("rx")) kg = 43;
        else if (division.equalsIgnoreCase("teens")) kg = 20;
        else kg = 29;

        String pull;
        if (division.equalsIgnoreCase("rx")) pull = "pull-ups";
        else if (division.equalsIgnoreCase("teens")) pull = "ring rows";
        else pull = "jumping pull-ups";

        String tag;
        if (division.equals("rx")) tag = "Rx";              // this one compares differently…
        else if (division.equals("teens")) tag = "Teens";
        else tag = "Scaled";                                // …so "RX" gets Rx weights and a Scaled tag

        return List.of("Fran · " + tag, "thrusters " + kg + " kg", pull);
    }
    // @end
}
