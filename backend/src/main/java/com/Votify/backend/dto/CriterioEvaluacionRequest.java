package com.Votify.backend.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class CriterioEvaluacionRequest {
    private String nombre;
    private String descripcion;
    private BigDecimal peso;
}
