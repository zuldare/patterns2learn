package com.patterns2learn.box.visitor.web;

import com.patterns2learn.box.visitor.InvalidElementException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(InvalidElementException.class)
    public ResponseEntity<Map<String, String>> badRequest(InvalidElementException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    /** JSON that can't become elements; an element that refuses its values says why. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        Throwable cause = e;
        while (cause.getCause() != null && !(cause instanceof InvalidElementException)) cause = cause.getCause();
        String reason = cause instanceof InvalidElementException ? cause.getMessage() : "malformed request body";
        return ResponseEntity.badRequest().body(Map.of("error", reason));
    }
}
