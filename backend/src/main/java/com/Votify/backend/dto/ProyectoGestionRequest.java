package com.Votify.backend.dto;

import java.util.List;
import java.util.UUID;

public record ProyectoGestionRequest(
    String nombre,
    String descripcion,
    String tipoCategoria,
    UUID equipoId,
    UUID eventoId,
    List<UUID> votacionIds
) {}
