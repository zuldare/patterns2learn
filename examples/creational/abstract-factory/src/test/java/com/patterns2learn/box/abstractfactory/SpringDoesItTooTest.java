package com.patterns2learn.box.abstractfactory;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class SpringDoesItTooTest {
    @Autowired DataSource dataSource;   // auto-configured by Spring Boot: H2 behind a HikariCP pool

    @Test void aConnectionMakesStatementsOfItsOwnDriverFamily() throws Exception {
        // @step:jdbc
        try (Connection connection = dataSource.getConnection();     // the factory for this database…
             Statement statement = connection.createStatement();     // …makes its statements
             PreparedStatement prepared = connection.prepareStatement("select 1");
             CallableStatement callable = connection.prepareCall("call 1")) {

            assertThat(statement.isWrapperFor(org.h2.jdbc.JdbcStatement.class)).isTrue();
            assertThat(prepared.isWrapperFor(org.h2.jdbc.JdbcPreparedStatement.class)).isTrue();
            assertThat(callable.isWrapperFor(org.h2.jdbc.JdbcCallableStatement.class)).isTrue();
        }
        // @end
        assertThat(dataSource).isInstanceOf(com.zaxxer.hikari.HikariDataSource.class);   // the pool…
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            assertThat(s).isNotInstanceOf(org.h2.jdbc.JdbcStatement.class);              // …hands out wrappers
        }
    }
}
