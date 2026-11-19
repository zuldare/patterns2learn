package com.patterns2learn.box.state;

/** The context: what the rest of the app talks to. It hands every action to its current state. */
public class Membership {
    static final int TRIAL_VISITS = 3;
    private final int id;
    private final String athlete;
    private MembershipState state;
    private int trialVisitsUsed;

    public Membership(int id, String athlete, MembershipState state, int trialVisitsUsed) {
        if (state == null) throw new IllegalArgumentException("state is required");
        if (trialVisitsUsed < 0 || trialVisitsUsed > TRIAL_VISITS) throw new IllegalArgumentException("trial visits must be between 0 and 3");
        this.id = id;
        this.athlete = athlete;
        this.state = state;
        this.trialVisitsUsed = trialVisitsUsed;
    }

    // @step:context
    public void checkIn() { state = state.checkIn(this); }
    public void freeze()  { state = state.freeze(this); }
    public void resume()  { state = state.resume(this); }
    public void renew()   { state = state.renew(this); }
    public void expire()  { state = state.expire(this); }
    // @end

    void useTrialVisit() {
        trialVisitsUsed++;
    }

    public int trialVisitsLeft() {
        return state == MembershipState.TRIAL ? TRIAL_VISITS - trialVisitsUsed : 0;
    }

    public int id() { return id; }
    public String athlete() { return athlete; }
    public MembershipState state() { return state; }
    int trialVisitsUsed() { return trialVisitsUsed; }
}
