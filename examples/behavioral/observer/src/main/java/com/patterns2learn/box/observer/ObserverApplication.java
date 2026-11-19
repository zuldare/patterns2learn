package com.patterns2learn.box.observer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ObserverApplication {
    public static void main(String[] args) {
        SpringApplication.run(ObserverApplication.class, args);
    }
}
