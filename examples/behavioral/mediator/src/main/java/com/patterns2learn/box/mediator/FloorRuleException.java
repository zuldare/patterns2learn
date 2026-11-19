package com.patterns2learn.box.mediator;

/** Something that can't happen on the floor right now (finishing before the start…). */
public class FloorRuleException extends RuntimeException {
    public FloorRuleException(String message) {
        super(message);
    }
}
