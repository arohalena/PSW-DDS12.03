package com.Votify.backend.dto;

import java.math.BigDecimal;


public record CriterioEvaluacionRequest (
    String nombre,
    String descripcion,
    BigDecimal peso
) {}
