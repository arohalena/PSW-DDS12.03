package com.Votify.backend.dto;

import java.util.List;
import java.util.UUID;

import lombok.Data;

@Data
public class EmitirEvaluacionRequest {
    private UUID votacionProyectoId;
    private String anonTokenHash;
    private String comentario;
    private List<PuntuacionCriterioRequest> puntuaciones;
}