package com.Votify.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class EventoDTO {
    private String nombre;
    private String descripcion;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private UUID organizadorId;
    private String tipoEvento; // PUBLICO | JURADO | MIXTO
}