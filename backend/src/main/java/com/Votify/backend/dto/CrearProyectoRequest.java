package com.Votify.backend.dto;

import java.util.List;
import java.util.UUID;

public record CrearProyectoRequest (

    String nombre,
    String descripcion,
    String tipoCategoria,
    String nombreEquipo,
    List<String> miembrosEmails,
    UUID eventoId) {}
