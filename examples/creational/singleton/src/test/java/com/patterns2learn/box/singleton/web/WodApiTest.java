package com.patterns2learn.box.singleton.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.patterns2learn.box.singleton.BookingService;
import com.patterns2learn.box.singleton.WodCatalog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest({WodController.class, BookingController.class})
@Import({WodCatalog.class, BookingService.class})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class WodApiTest {
    private static final String MURPH = """
        {"name":"Murph","workout":"1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run"}""";

    @Autowired MockMvc mvc;

    @Test void listsTheWodsSortedByName() throws Exception {
        mvc.perform(get("/api/wods"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$[0].name").value("Cindy"))
           .andExpect(jsonPath("$[1].name").value("Fran"));
    }

    @Test void aWodAddedByTheCoachCanBeBookedRightAway() throws Exception {
        // @step:shared-instance
        mvc.perform(post("/api/wods").contentType(MediaType.APPLICATION_JSON).content(MURPH))
           .andExpect(status().isCreated());

        // BookingService sees Murph: both controllers share the one WodCatalog bean
        mvc.perform(post("/api/bookings").param("wod", "Murph"))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.wod").value("Murph"));
        // @end
    }

    @Test void duplicateWodIs409() throws Exception {
        mvc.perform(post("/api/wods").contentType(MediaType.APPLICATION_JSON).content(MURPH)).andExpect(status().isCreated());
        mvc.perform(post("/api/wods").contentType(MediaType.APPLICATION_JSON).content(MURPH))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("WOD already exists: Murph"));
    }

    @Test void unknownWodIs404() throws Exception {
        mvc.perform(post("/api/bookings").param("wod", "Yoga"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.error").value("unknown WOD: Yoga"));
    }

    @Test void wodWithoutNameIs400() throws Exception {
        mvc.perform(post("/api/wods").contentType(MediaType.APPLICATION_JSON).content("{\"workout\":\"row 500 m\"}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("WOD name is required"));
    }
}
