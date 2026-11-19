package com.patterns2learn.box.chain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AccessControlTest {
    @Autowired AccessControl access;
    @Autowired BoxRegistry box;
    @Autowired AuditRule audit;

    @Test void anaGetsInAndTakesASpot() {
        assertThat(access.decide(new CheckIn("Ana", 1))).isEqualTo(AccessDecision.allow());
        assertThat(box.spotsLeft(1)).isEqualTo(1);
    }

    @Test void leoIsStoppedAtTheWaiverAndTakesNoSpot() {
        // @step:denied
        AccessDecision decision = access.decide(new CheckIn("Leo", 1));

        assertThat(decision).isEqualTo(AccessDecision.deny("waiver not signed"));
        assertThat(box.spotsLeft(1)).isEqualTo(2); // the chain stopped before CapacityRule
        // @end
    }

    @Test void miaIsStoppedAtTheMembership() {
        assertThat(access.decide(new CheckIn("Mia", 1))).isEqualTo(AccessDecision.deny("membership expired"));
    }

    @Test void aFullClassStopsEvenAValidMember() {
        access.decide(new CheckIn("Ana", 1));
        access.decide(new CheckIn("Bea", 1));
        assertThat(access.decide(new CheckIn("Cris", 1))).isEqualTo(AccessDecision.deny("class is full"));
        assertThat(box.spotsLeft(1)).isZero();
    }

    @Test void unknownSessionIsDenied() {
        assertThat(access.decide(new CheckIn("Ana", 9))).isEqualTo(AccessDecision.deny("unknown session: 9"));
    }

    @Test void theAuditRuleSeesEveryOutcomeOnTheWayBack() {
        access.decide(new CheckIn("Ana", 1));
        access.decide(new CheckIn("Leo", 1));
        assertThat(audit.log()).containsExactly("Ana → session 1: granted", "Leo → session 1: denied (waiver not signed)");
    }

    @Test void blankAthleteIsInvalid() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> new CheckIn(" ", 1))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("athlete is required");
    }
}
