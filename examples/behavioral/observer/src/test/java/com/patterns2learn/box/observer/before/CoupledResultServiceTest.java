package com.patterns2learn.box.observer.before;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.observer.LiftResult;
import org.junit.jupiter.api.Test;

class CoupledResultServiceTest {
    @Test void whenOneCollaboratorFailsTheResultIsLost() {
        var badges = new CoupledResultService.Badges(true); // badge service is down
        var service = new CoupledResultService(new CoupledResultService.Notifier(), new CoupledResultService.Leaderboard(), badges);

        assertThatThrownBy(() -> service.record(new LiftResult("Ana", "Back squat", 105))).isInstanceOf(IllegalStateException.class);
        assertThat(service.bestOf("Ana", "Back squat")).isZero(); // the PR itself was never stored
    }
}
