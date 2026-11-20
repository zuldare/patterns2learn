package com.patterns2learn.box.memento;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class SpringDoesItTooTest {
    @Autowired JdbcClient jdbc;
    @Autowired TransactionTemplate tx;

    @Test void aSavepointIsAMementoOfTheTransaction() {
        Integer rows = tx.execute(status -> {
            // @step:savepoint
            jdbc.sql("insert into pr (athlete, lift, kg) values ('Ana', 'clean', 70)").update();
            Object savepoint = status.createSavepoint();    // opaque: you can't look inside
            jdbc.sql("insert into pr (athlete, lift, kg) values ('Ana', 'clean', 700)").update();   // typo
            status.rollbackToSavepoint(savepoint);          // back to it; the transaction goes on
            // @end
            int n = jdbc.sql("select count(*) from pr").query(Integer.class).single();
            status.setRollbackOnly();
            return n;
        });
        assertThat(rows).isEqualTo(1);
    }
}
