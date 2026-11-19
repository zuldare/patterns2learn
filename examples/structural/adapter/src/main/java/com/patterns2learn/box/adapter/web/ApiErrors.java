package com.patterns2learn.box.adapter.web;

import com.patterns2learn.box.adapter.MonitorException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.patterns2learn.box.adapter.UnknownAthleteException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    private static final Logger log = LoggerFactory.getLogger(ApiErrors.class);

    @ExceptionHandler(UnknownAthleteException.class)
    public ResponseEntity<Map<String, String>> notFound(UnknownAthleteException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    /** The band (an upstream device) answered with garbage: not the client's fault. */
    @ExceptionHandler(MonitorException.class)
    public ResponseEntity<Map<String, String>> badGateway(MonitorException e) {
        log.warn("heart-rate band error: {}", e.getMessage());   // vendor details stay in the logs
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "the heart-rate band sent an unreadable reading"));
    }
}
