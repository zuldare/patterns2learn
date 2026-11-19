package com.patterns2learn.box.state.before;

/** Before: the status is a String, and every action switches on it. */
public class SwitchingMembership {
    private String status;   // "trial", "active", "frozen", "expired"

    public SwitchingMembership(String status) {
        this.status = status;
    }

    // @step:switching
    public void checkIn() {
        switch (status) {
            case "trial", "active" -> { /* come in (and trial visits? another field, another if) */ }
            case "frozen" -> throw new IllegalStateException("membership is frozen: resume it first");
            case "expired" -> throw new IllegalStateException("membership expired: renew it to come in");
            default -> throw new IllegalStateException("unknown status: " + status);
        }
    }

    public void freeze() {
        switch (status) {
            case "active" -> status = "frozen";
            case "trial", "frozen", "expired" -> throw new IllegalStateException("can't freeze a " + status + " membership");
            default -> throw new IllegalStateException("unknown status: " + status);
        }
    }

    public void resume() {
        switch (status) {
            case "frozen" -> status = "active";
            case "trial", "active", "expired" -> throw new IllegalStateException("can't resume a " + status + " membership");
            default -> throw new IllegalStateException("unknown status: " + status);
        }
    }
    // @end

    public String status() {
        return status;
    }
}
