package com.patterns2learn.box.strategy;

public class UnknownPlanException extends RuntimeException {
    public UnknownPlanException(String plan) {
        super("unknown plan: " + plan);
    }
}
