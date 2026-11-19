package com.patterns2learn.box.composite.web;

import com.patterns2learn.box.composite.InvalidWorkoutException;
import com.patterns2learn.box.composite.UnknownWodException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(UnknownWodException.class)
    public ResponseEntity<Map<String, String>> notFound(UnknownWodException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    /** A tree whose parts break their own rules surfaces with the part's reason; anything else is malformed. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        Throwable cause = e;
        while (cause.getCause() != null && !(cause instanceof InvalidWorkoutException)) cause = cause.getCause();
        String reason = cause instanceof InvalidWorkoutException ? cause.getMessage() : "malformed request body";
        return ResponseEntity.badRequest().body(Map.of("error", reason));
    }
}
