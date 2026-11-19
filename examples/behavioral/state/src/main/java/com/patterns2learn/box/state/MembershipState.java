package com.patterns2learn.box.state;

import java.util.Locale;

/**
 * The states. Each one decides what each action does while the membership is in it,
 * and returns the state that comes next. By default an action isn't allowed.
 */
public enum MembershipState {
    // @step:states
    TRIAL {
        @Override MembershipState checkIn(Membership m) {
            if (m.trialVisitsLeft() == 0) throw new MembershipRuleException("trial used up: renew to keep training");
            m.useTrialVisit();
            return this;
        }
        @Override MembershipState renew(Membership m) { return ACTIVE; }
    },
    ACTIVE {
        @Override MembershipState checkIn(Membership m) { return this; }
        @Override MembershipState freeze(Membership m) { return FROZEN; }
        @Override MembershipState renew(Membership m) { return this; }
        @Override MembershipState expire(Membership m) { return EXPIRED; }
    },
    FROZEN {
        @Override MembershipState checkIn(Membership m) {
            throw new MembershipRuleException("membership is frozen: resume it first");
        }
        @Override MembershipState resume(Membership m) { return ACTIVE; }
        @Override MembershipState expire(Membership m) { return EXPIRED; }
    },
    EXPIRED {
        @Override MembershipState checkIn(Membership m) {
            throw new MembershipRuleException("membership expired: renew it to come in");
        }
        @Override MembershipState renew(Membership m) { return ACTIVE; }
    };
    // @end

    // @step:defaults
    abstract MembershipState checkIn(Membership m);   // every state must decide this one
    MembershipState freeze(Membership m) { return refuse("freeze"); }
    MembershipState resume(Membership m) { return refuse("resume"); }
    MembershipState renew(Membership m) { return refuse("renew"); }
    MembershipState expire(Membership m) { return refuse("expire"); }

    private MembershipState refuse(String action) {
        String name = name().toLowerCase(Locale.ROOT);
        String article = "aeiou".indexOf(name.charAt(0)) >= 0 ? "an " : "a ";
        throw new MembershipRuleException("can't " + action + " " + article + name + " membership");
    }
    // @end
}
