package com.patterns2learn.box.abstractfactory;

/** Product (data): the barbell load for the WOD's lift. */
public record Barbell(int thrusterKg) {
    public Barbell {
        if (thrusterKg < 1 || thrusterKg > 200) throw new IllegalArgumentException("load must be between 1 and 200 kg");
    }

    public String thrusters() {
        return "thrusters " + thrusterKg + " kg";
    }
}
