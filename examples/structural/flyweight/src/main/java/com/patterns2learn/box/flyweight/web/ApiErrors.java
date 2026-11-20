package com.patterns2learn.box.flyweight.web;

import com.patterns2learn.box.flyweight.InvalidSetException;
import com.patterns2learn.box.flyweight.LogFullException;
import com.patterns2learn.box.flyweight.UnknownMovementException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(UnknownMovementException.class)
    public ResponseEntity<Map<String, String>> notFound(UnknownMovementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(LogFullException.class)
    public ResponseEntity<Map<String, String>> conflict(LogFullException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(InvalidSetException.class)
    public ResponseEntity<Map<String, String>> badRequest(InvalidSetException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(Map.of("error", "malformed request body"));
    }
}
