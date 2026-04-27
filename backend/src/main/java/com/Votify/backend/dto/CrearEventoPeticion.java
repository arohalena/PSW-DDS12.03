package com.Votify.backend.dto;

import java.time.OffsetDateTime;

public record CrearEventoPeticion (
    String tipo,
    String nombre,
    String descripcion,
    String codigoAccesoPublico,
    OffsetDateTime fecha_inicio,
    OffsetDateTime fecha_fin
) {}