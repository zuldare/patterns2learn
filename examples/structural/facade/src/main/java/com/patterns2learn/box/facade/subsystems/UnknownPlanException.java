package com.patterns2learn.box.facade.subsystems;

public class UnknownPlanException extends IllegalArgumentException {
    public UnknownPlanException(String plan) {
        super("unknown plan: " + plan);
    }
}
