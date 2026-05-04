package com.Votify.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.CambiarModoRankingRequest;
import com.Votify.backend.dto.GuardarOrdenRankingRequest;
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

    @PutMapping("/evento/{eventoId}/votacion/{votacionId}/modo")
    public ResponseEntity<Void> cambiarModo(
        @PathVariable UUID eventoId,
        @PathVariable UUID votacionId,
        @RequestBody CambiarModoRankingRequest request
    ){
        rankingService.cambiarModo(votacionId, request.usuarioId(), request.modo());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/evento/{eventoId}/votacion/{votacionId}/orden")
    public ResponseEntity<Void> guardarOrden(
        @PathVariable UUID eventoId,
        @PathVariable UUID votacionId,
        @RequestBody GuardarOrdenRankingRequest request
    ){
        List<Map<String, Object>> posiciones = request.posiciones().stream()
            .map(item -> {
                Map<String, Object> m = new HashMap<>();
                m.put("votacionProyectoId", item.votacionProyectoId());
                m.put("posicion", item.posicion());
                return m;
            })
            .toList();

        rankingService.guardarOrdenManual(votacionId, request.usuarioId(), posiciones);
        return ResponseEntity.noContent().build();
    }
}