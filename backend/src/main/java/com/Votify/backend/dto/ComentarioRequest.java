package com.Votify.backend.dto;

import java.util.UUID;

public record ComentarioRequest (
    
    UUID proyectoId,
    UUID usuarioId,
    String texto

) {}
