package com.patterns2learn.box.facade.subsystems;

public class CardsOutOfStockException extends RuntimeException {
    public CardsOutOfStockException() {
        super("no access cards left");
    }
}
