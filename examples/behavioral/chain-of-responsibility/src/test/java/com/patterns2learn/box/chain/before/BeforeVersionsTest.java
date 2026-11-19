package com.patterns2learn.box.chain.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.chain.AccessDecision;
import com.patterns2learn.box.chain.BoxRegistry;
import com.patterns2learn.box.chain.CheckIn;
import org.junit.jupiter.api.Test;

class BeforeVersionsTest {
    @Test void theMonolithGivesTheSameAnswers() {
        var box = new BoxRegistry();
        var monolith = new MonolithicCheckIn(box);
        assertThat(monolith.checkIn(new CheckIn("Leo", 1))).isEqualTo(AccessDecision.deny("waiver not signed"));
        assertThat(monolith.checkIn(new CheckIn("Ana", 1))).isEqualTo(AccessDecision.allow());
    }

    @Test void gofHandlersPassTheRequestAlong() {
        var box = new BoxRegistry();
        AccessHandler chain = new MembershipHandler(box);
        chain.linkWith(new WaiverHandler(box))
             .linkWith(new CapacityHandler(box));

        assertThat(chain.handle(new CheckIn("Leo", 1))).isEqualTo(AccessDecision.deny("waiver not signed"));
        assertThat(chain.handle(new CheckIn("Ana", 1))).isEqualTo(AccessDecision.allow());
        assertThat(box.spotsLeft(1)).isEqualTo(1);
    }
}
