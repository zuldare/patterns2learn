package com.patterns2learn.box.facade;

import java.util.Locale;
import java.util.regex.Pattern;

/** What someone fills in to join the box. */
public record JoinRequest(String name, String email, String plan, String paymentToken) {
    private static final Pattern EMAIL = Pattern.compile("[^@\\s]{1,64}@[^@\\s]{1,190}\\.[^@\\s]{2,63}");

    public JoinRequest {
        if (name == null || name.isBlank()) throw new InvalidJoinRequestException("name is required");
        name = name.strip();
        if (name.length() > 60) throw new InvalidJoinRequestException("name is at most 60 characters");
        email = email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
        if (!EMAIL.matcher(email).matches()) throw new InvalidJoinRequestException("a valid email is required");
        if (plan == null || plan.isBlank()) throw new InvalidJoinRequestException("plan is required");
        plan = plan.strip().toLowerCase(Locale.ROOT);
        if (paymentToken == null || paymentToken.isBlank()) throw new InvalidJoinRequestException("payment token is required");
    }
}
