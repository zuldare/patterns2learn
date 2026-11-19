package com.patterns2learn.box.abstractfactory;

public class UnknownDivisionException extends RuntimeException {
    public UnknownDivisionException(String division) {
        super("unknown division: " + division);
    }
}
