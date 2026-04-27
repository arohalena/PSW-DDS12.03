package com.Votify.backend.config;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.Votify.backend.service.VotacionService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class VotacionScheduler {

    private final VotacionService votacionService;

    @Scheduled(fixedDelay = 60_000L)
    public void aplicarTransiciones() {

        votacionService.aplicarTransicionesAutomaticas();
        
    }
}