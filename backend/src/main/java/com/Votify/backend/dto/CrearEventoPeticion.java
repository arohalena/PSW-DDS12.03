package com.Votify.backend.dto;

import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class CrearEventoPeticion {
    private String tipo;
    private String nombre;
    private String descripcion;
    private String codigoAccesoPublico;
    private OffsetDateTime fecha_inicio;
    private OffsetDateTime fecha_fin;

}