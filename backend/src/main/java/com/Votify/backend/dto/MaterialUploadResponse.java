package com.Votify.backend.dto;

import java.util.UUID;

public record MaterialUploadResponse(
    UUID id,
    String nombre,
    String rutaFichero,
    String tipoMime,
    Long tamanyo
) {}
