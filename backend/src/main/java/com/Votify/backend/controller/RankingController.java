package com.Votify.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.service.RankingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    @GetMapping("/evento/{eventoId}/votacion/{votacionId}")
    public List<Map<String, Object>> getRanking(@PathVariable UUID eventoId, @PathVariable UUID votacionId){

        return rankingService.calcularRanking(eventoId, votacionId);
        
    }
}
