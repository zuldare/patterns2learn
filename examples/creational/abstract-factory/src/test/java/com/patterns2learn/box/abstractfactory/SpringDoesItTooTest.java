package com.patterns2learn.box.abstractfactory;

import static org.assertj.core.api.Assertions.assertThat;

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
             PreparedStatement prepared = connection.prepareStatement("select 1")) {

            assertThat(connection.getMetaData().getDatabaseProductName()).isEqualTo("H2");
            assertThat(statement.isWrapperFor(org.h2.jdbc.JdbcStatement.class)).isTrue();
            assertThat(prepared.isWrapperFor(org.h2.jdbc.JdbcPreparedStatement.class)).isTrue();
        }
        // @end
    }
}
