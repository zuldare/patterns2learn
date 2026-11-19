package com.patterns2learn.box.state;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class MembershipTest {
    @Test void aTrialGivesThreeVisitsAndThenAsksYouToJoin() {
        Membership leo = new Membership(2, "Leo", MembershipState.TRIAL, 0);
        leo.checkIn();
        leo.checkIn();
        leo.checkIn();
        assertThat(leo.trialVisitsLeft()).isZero();
        assertThatThrownBy(leo::checkIn).isInstanceOf(MembershipRuleException.class)
            .hasMessage("trial used up: renew to keep training");
        leo.renew();
        assertThat(leo.state()).isEqualTo(MembershipState.ACTIVE);
        leo.checkIn();
    }

    @Test void freezingAndResuming() {
        // @step:freeze
        Membership ana = new Membership(1, "Ana", MembershipState.ACTIVE, 0);

        ana.freeze();                                       // ACTIVE → FROZEN
        assertThatThrownBy(ana::checkIn).hasMessage("membership is frozen: resume it first");
        ana.resume();                                       // FROZEN → ACTIVE
        ana.checkIn();
        // @end
        assertThat(ana.state()).isEqualTo(MembershipState.ACTIVE);
    }

    @Test void expiryAndRenewal() {
        Membership eva = new Membership(3, "Eva", MembershipState.FROZEN, 0);
        eva.expire();
        assertThat(eva.state()).isEqualTo(MembershipState.EXPIRED);
        assertThatThrownBy(eva::checkIn).hasMessage("membership expired: renew it to come in");
        eva.renew();
        assertThat(eva.state()).isEqualTo(MembershipState.ACTIVE);
    }

    @Test void whatAStateDoesNotAllowHasAClearDefaultMessage() {
        Membership trial = new Membership(2, "Leo", MembershipState.TRIAL, 0);
        assertThatThrownBy(trial::freeze).hasMessage("can't freeze a trial membership");
        assertThatThrownBy(trial::resume).hasMessage("can't resume a trial membership");
        assertThatThrownBy(trial::expire).hasMessage("can't expire a trial membership");
        Membership active = new Membership(1, "Ana", MembershipState.ACTIVE, 0);
        assertThatThrownBy(active::resume).hasMessage("can't resume an active membership");
        Membership expired = new Membership(4, "Max", MembershipState.EXPIRED, 0);
        assertThatThrownBy(expired::freeze).hasMessage("can't freeze an expired membership");
        assertThat(trial.state()).isEqualTo(MembershipState.TRIAL);   // a refused action changes nothing
    }

    @Test void renewingATrialLeavesNoTrialVisits() {
        Membership leo = new Membership(2, "Leo", MembershipState.TRIAL, 1);
        assertThat(leo.trialVisitsLeft()).isEqualTo(2);
        leo.renew();
        assertThat(leo.trialVisitsLeft()).isZero();
    }

    @Test void trialVisitsOnlyMakeSenseForATrial() {
        assertThat(new Membership(1, "Ana", MembershipState.ACTIVE, 0).trialVisitsLeft()).isZero();
        assertThatThrownBy(() -> new Membership(2, "Leo", MembershipState.TRIAL, 4)).hasMessage("trial visits must be between 0 and 3");
        assertThatThrownBy(() -> new Membership(2, "Leo", null, 0)).hasMessage("state is required");
    }
}
