package com.Votify.backend.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class EmitirVotoSimpleRequest {
    private UUID votacionProyectoId;
    private String anonTokenHash;
    private String comentario;
}