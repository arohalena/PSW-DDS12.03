package com.Votify.backend.dto;

import java.util.UUID;


public record PuntuacionCriterioRequest (
    UUID criterioId,
    Integer puntuacion,
    String comentario
) {}

