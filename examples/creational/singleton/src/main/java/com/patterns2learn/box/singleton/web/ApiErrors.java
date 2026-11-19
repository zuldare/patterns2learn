package com.patterns2learn.box.singleton.web;

import com.patterns2learn.box.singleton.DuplicateWodException;
import com.patterns2learn.box.singleton.UnknownWodException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}
