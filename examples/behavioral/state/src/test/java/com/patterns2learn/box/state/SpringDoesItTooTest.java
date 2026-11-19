package com.patterns2learn.box.state;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Transactional
class SpringDoesItTooTest {
    @Autowired MembershipRepository repository;
    @Autowired JdbcClient jdbc;

    @Test void twoRequestsChangingTheSameMembershipAtOnceDoNotBothWin() {
        Membership first = repository.find(2).orElseThrow();    // Leo, trial, 0 visits used
        Membership second = repository.find(2).orElseThrow();   // read at the same time by another request
        first.checkIn();
        second.checkIn();
        repository.save(first, MembershipState.TRIAL, 0);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> repository.save(second, MembershipState.TRIAL, 0))
            .isInstanceOf(ConcurrentChangeException.class)
            .hasMessage("membership changed meanwhile, try again");
    }

    @Test void theDatabaseRefusesStatesTheCodeDoesNotKnow() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            jdbc.sql("update membership set status = 'PAUSED' where id = 1").update())
            .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test void theStateIsStoredByNameAndComesBackAsTheSameObject() {
        Membership ana = repository.find(1).orElseThrow();
        ana.freeze();
        repository.save(ana, MembershipState.ACTIVE, 0);

        String column = jdbc.sql("select status from membership where id = 1").query(String.class).single();
        assertThat(column).isEqualTo("FROZEN");
        assertThat(repository.find(1).orElseThrow().state()).isSameAs(MembershipState.FROZEN);   // an enum constant is always the same object
    }
}
