package com.patterns2learn.box.prototype;

public class UnknownTemplateException extends RuntimeException {
    public UnknownTemplateException(String name) {
        super("unknown template: " + name);
    }
}
