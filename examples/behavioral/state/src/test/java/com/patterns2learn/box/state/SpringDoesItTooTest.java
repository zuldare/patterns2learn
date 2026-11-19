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

    @Test void theStateIsStoredByNameAndComesBackAsTheSameObject() {
        Membership ana = repository.find(1).orElseThrow();
        ana.freeze();
        repository.save(ana);

        String column = jdbc.sql("select status from membership where id = 1").query(String.class).single();
        assertThat(column).isEqualTo("FROZEN");
        assertThat(repository.find(1).orElseThrow().state()).isSameAs(MembershipState.FROZEN);   // one object per state
    }
}
