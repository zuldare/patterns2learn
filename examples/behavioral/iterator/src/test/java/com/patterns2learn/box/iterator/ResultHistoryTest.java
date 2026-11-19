package com.patterns2learn.box.iterator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class ResultHistoryTest {
    @Autowired JdbcClient jdbc;

    @Test void walksEveryResultInOrderOnePageAtATime() {
        ResultHistory history = new ResultHistory(jdbc, 50);
        List<Result> all = new ArrayList<>();
        for (Result r : history.fastest("fran")) all.add(r);

        assertThat(all).hasSize(230);
        assertThat(all).isSortedAccordingTo(java.util.Comparator.comparingInt(Result::seconds).thenComparingInt(Result::id));
        assertThat(history.pagesFetched()).isEqualTo(5);   // 50 + 50 + 50 + 50 + 30: a short page means there is no next one
    }

    @Test void stoppingEarlyMeansNoMorePagesAreFetched() {
        // @step:lazy
        ResultHistory history = new ResultHistory(jdbc, 50);
        List<Result> podium = new ArrayList<>();
        for (Result r : history.fastest("fran")) {
            podium.add(r);
            if (podium.size() == 3) break;                  // the loop decides when to stop…
        }
        assertThat(history.pagesFetched()).isEqualTo(1);    // …and only one page was ever read
        // @end
        assertThat(podium).extracting(Result::seconds).containsExactly(151, 153, 155);
    }

    @Test void anIteratorFollowsTheJavaContract() {
        ResultHistory history = new ResultHistory(jdbc, 1);
        Iterator<Result> it = history.fastest("helen").iterator();
        assertThat(it.hasNext()).isTrue();
        assertThat(it.hasNext()).isTrue();                  // asking twice doesn't skip anything
        assertThat(it.next().athlete()).isEqualTo("Ana");
        assertThat(it.next().athlete()).isEqualTo("Leo");
        assertThat(it.hasNext()).isFalse();
        assertThatThrownBy(it::next).isInstanceOf(NoSuchElementException.class);
        assertThat(history.fastest("murph").iterator().hasNext()).isFalse();
    }

    @Test void eachLoopGetsItsOwnIterator() {
        Iterable<Result> fran = new ResultHistory(jdbc, 50).fastest("fran");
        assertThat(fran.iterator().next().seconds()).isEqualTo(151);
        assertThat(fran.iterator().next().seconds()).isEqualTo(151);   // a fresh walk, from the start
    }

    @Test void pageSizeIsValidated() {
        assertThatThrownBy(() -> new ResultHistory(jdbc, 0)).hasMessage("page size must be between 1 and 500");
    }
}
