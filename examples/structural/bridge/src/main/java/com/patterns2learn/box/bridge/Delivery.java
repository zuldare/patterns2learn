package com.patterns2learn.box.bridge;

/** What a channel actually sent, and to where. */
public record Delivery(String channel, String to, String text) {}
