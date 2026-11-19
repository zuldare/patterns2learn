package com.patterns2learn.box.chain;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

class SpringDoesItTooTest {
    // @step:servlet-chain
    static class WaiverHeaderFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                throws ServletException, IOException {
            if (req.getHeader("X-Waiver-Signed") == null) {
                res.sendError(403, "waiver not signed");   // stop here: nobody further down sees it
                return;
            }
            chain.doFilter(req, res);                        // pass it along
        }
    }
    // @end

    static class TheApp extends HttpServlet {
        boolean reached;

        @Override
        protected void service(HttpServletRequest req, HttpServletResponse res) {
            reached = true;
        }
    }

    @Test void aServletFilterCanStopTheRequestOrPassItOn() throws Exception {
        var app = new TheApp();
        var blocked = new MockHttpServletResponse();
        new MockFilterChain(app, new WaiverHeaderFilter()).doFilter(new MockHttpServletRequest("GET", "/api/wods"), blocked);
        assertThat(blocked.getStatus()).isEqualTo(403);
        assertThat(app.reached).isFalse();

        var signed = new MockHttpServletRequest("GET", "/api/wods");
        signed.addHeader("X-Waiver-Signed", "2026-11-19");
        new MockFilterChain(app, new WaiverHeaderFilter()).doFilter(signed, new MockHttpServletResponse());
        assertThat(app.reached).isTrue();
    }
}
