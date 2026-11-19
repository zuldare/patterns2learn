package com.patterns2learn.box.builder;

import java.time.LocalTime;

/** What the coach sends. Everything except name and start time is optional (null = use the default). */
public record SessionRequest(String name, LocalTime startsAt, Integer minutes, Integer capacity,
                             String coach, Boolean beginnerFriendly, Boolean waitlist) {}
