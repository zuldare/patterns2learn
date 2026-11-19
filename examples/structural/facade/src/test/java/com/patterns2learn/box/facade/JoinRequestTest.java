package com.patterns2learn.box.facade;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class JoinRequestTest {
    @Test void requestsAreValidatedAndNormalised() {
        JoinRequest r = new JoinRequest("  Ana ", " Ana@Box.Example ", " Unlimited ", "tok_visa");
        assertThat(r.name()).isEqualTo("Ana");
        assertThat(r.email()).isEqualTo("ana@box.example");
        assertThat(r.plan()).isEqualTo("unlimited");
        assertThatThrownBy(() -> new JoinRequest(" ", "a@b.co", "unlimited", "t")).hasMessage("name is required");
        assertThatThrownBy(() -> new JoinRequest("x".repeat(61), "a@b.co", "unlimited", "t")).hasMessage("name is at most 60 characters");
        assertThatThrownBy(() -> new JoinRequest("Ana", "not-an-email", "unlimited", "t")).hasMessage("a valid email is required");
        assertThatThrownBy(() -> new JoinRequest("Ana", null, "unlimited", "t")).hasMessage("a valid email is required");
        assertThatThrownBy(() -> new JoinRequest("Ana", "a@b.co", null, "t")).hasMessage("plan is required");
        assertThatThrownBy(() -> new JoinRequest("Ana", "a@b.co", "unlimited", " ")).hasMessage("payment token is required");
    }
}
