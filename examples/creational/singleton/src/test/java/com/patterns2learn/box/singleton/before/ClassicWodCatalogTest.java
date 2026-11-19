package com.patterns2learn.box.singleton.before;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.singleton.DuplicateWodException;
import com.patterns2learn.box.singleton.Wod;
import org.junit.jupiter.api.Test;

class ClassicWodCatalogTest {
    @Test void everyCallerSharesOneInstanceAndItsState() {
        // @step:classic-leak
        ClassicWodCatalog a = ClassicWodCatalog.getInstance();
        ClassicWodCatalog b = ClassicWodCatalog.getInstance();
        assertThat(a).isSameAs(b);

        a.add(new Wod("Grace", "30 clean and jerks for time"));
        assertThat(b.find("Grace")).isPresent(); // ...and so does every other test in this JVM
        // @end
    }

    @Test void behavesLikeTheSpringCatalog() {
        ClassicWodCatalog catalog = ClassicWodCatalog.getInstance();
        assertThat(catalog.find("Cindy")).isPresent();
        assertThatThrownBy(() -> catalog.add(new Wod("Fran", "something else"))).isInstanceOf(DuplicateWodException.class);
    }
}
