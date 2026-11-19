package com.patterns2learn.box.singleton.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.singleton.Wod;
import org.junit.jupiter.api.Test;

class NaiveWiringTest {
    @Test void eachConsumerGetsItsOwnCopy() {
        // @step:naive-smell
        var controller = new NaiveWiring.NaiveWodController();
        var bookings = new NaiveWiring.NaiveBookingService();

        controller.add(new Wod("Murph", "1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run"));

        assertThat(controller.list()).extracting(Wod::name).contains("Murph");
        assertThat(bookings.canBook("Murph")).isFalse(); // a different catalog: Murph is missing
        // @end
    }
}
