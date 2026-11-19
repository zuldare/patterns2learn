package com.patterns2learn.box.facade.subsystems;

public class PaymentDeclinedException extends RuntimeException {
    public PaymentDeclinedException() {
        super("payment declined");
    }
}
