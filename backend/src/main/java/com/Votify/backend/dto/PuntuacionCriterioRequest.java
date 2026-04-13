package com.Votify.backend.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class PuntuacionCriterioRequest {
    private UUID criterioId;
    private Integer puntuacion;
}

