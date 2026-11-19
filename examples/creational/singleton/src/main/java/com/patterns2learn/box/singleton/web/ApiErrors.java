package com.patterns2learn.box.singleton.web;

import com.patterns2learn.box.singleton.DuplicateWodException;
import com.patterns2learn.box.singleton.UnknownWodException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(DuplicateWodException.class)
    public ResponseEntity<Map<String, String>> conflict(DuplicateWodException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(UnknownWodException.class)
    public ResponseEntity<Map<String, String>> notFound(UnknownWodException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    /** A body that can't become a Wod (e.g. no name) is the client's fault: 400 with the reason. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> badRequest(HttpMessageNotReadableException e) {
        Throwable cause = e;
        while (cause.getCause() != null && !(cause instanceof IllegalArgumentException)) {
            cause = cause.getCause();
        }
        String reason = cause instanceof IllegalArgumentException ? cause.getMessage() : "malformed request body";
        return ResponseEntity.badRequest().body(Map.of("error", reason));
    }
}
