package com.patterns2learn.box.abstractfactory.web;

import com.patterns2learn.box.abstractfactory.UnknownDivisionException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(UnknownDivisionException.class)
    public ResponseEntity<Map<String, String>> badRequest(UnknownDivisionException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
