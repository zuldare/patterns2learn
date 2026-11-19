package com.patterns2learn.box.state;

import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class MembershipRepository {
    private final JdbcClient jdbc;

    public MembershipRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // @step:persist
    public Optional<Membership> find(int id) {
        return jdbc.sql("select id, athlete, status, trial_visits from membership where id = ?")
            .param(id)
            .query((rs, n) -> new Membership(rs.getInt("id"), rs.getString("athlete"),
                MembershipState.valueOf(rs.getString("status")),        // "FROZEN" → MembershipState.FROZEN
                rs.getInt("trial_visits")))
            .optional();
    }

    public void save(Membership m) {
        jdbc.sql("update membership set status = ?, trial_visits = ? where id = ?")
            .params(m.state().name(), m.trialVisitsUsed(), m.id())      // only the state's name is stored
            .update();
    }
    // @end
}
