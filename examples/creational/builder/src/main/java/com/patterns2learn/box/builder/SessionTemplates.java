package com.patterns2learn.box.builder;

import java.time.LocalTime;
import java.util.Locale;
import org.springframework.stereotype.Component;

/** The director: knows the box's usual recipes and builds them step by step. */
@Component
public class SessionTemplates {
    // @step:director
    public ClassSession build(String template, LocalTime startsAt, String coach) {
        String key = template == null ? "" : template.strip().toLowerCase(Locale.ROOT);
        return switch (key) {
            case "beginner" -> ClassSession.builder("Beginners", startsAt)
                .minutes(75).capacity(8).coach(coach)
                .beginnerFriendly().waitlist()
                .build();
            case "open-gym" -> {
                if (coach != null) throw new IllegalArgumentException("an open gym has no coach");
                yield ClassSession.builder("Open gym", startsAt)
                    .minutes(120).capacity(20)
                    .build();
            }
            default -> throw new IllegalArgumentException("unknown template: " + abbreviate(template));
        };
    }
    // @end

    private static String abbreviate(String s) {
        if (s == null) return "";
        String t = s.strip();
        return t.length() <= 40 ? t : t.substring(0, 40) + "…";
    }
}
