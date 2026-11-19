package com.patterns2learn.box.observer.web;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    /** A body that can't become a LiftResult (e.g. kg 0) is the client's fault: 400 with the reason. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        Throwable cause = e;
        while (cause.getCause() != null && !(cause instanceof IllegalArgumentException)) {
            cause = cause.getCause();
        }
        String reason = cause instanceof IllegalArgumentException ? cause.getMessage() : "malformed request body";
        return ResponseEntity.badRequest().body(Map.of("error", reason));
    }
}
