package com.Votify.backend.dto;

import java.util.List;
import java.util.UUID;

public record GuardarOrdenRankingRequest(
    UUID usuarioId,
    List<PosicionItem> posiciones
) {
    public record PosicionItem(
        UUID votacionProyectoId,
        Integer posicion
    ) {}
}