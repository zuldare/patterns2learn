package com.patterns2learn.box.proxy.web;

import com.patterns2learn.box.proxy.ClassFullException;
import com.patterns2learn.box.proxy.UnknownSessionException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ClassFullException.class)
    public ResponseEntity<Map<String, String>> full(ClassFullException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(UnknownSessionException.class)
    public ResponseEntity<Map<String, String>> unknown(UnknownSessionException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }
}
