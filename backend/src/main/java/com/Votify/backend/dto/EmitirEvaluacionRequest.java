package com.Votify.backend.dto;

import java.util.List;
import java.util.UUID;

public record EmitirEvaluacionRequest (
    UUID votacionProyectoId,
    String anonTokenHash,
    String comentario,
    List<PuntuacionCriterioRequest> puntuaciones
) {}