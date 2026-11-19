package com.patterns2learn.box.abstractfactory;

/** Product: the barbell load for the WOD's lift. */
public record Barbell(int thrusterKg) {
    public String thrusters() {
        return "thrusters " + thrusterKg + " kg";
    }
}
