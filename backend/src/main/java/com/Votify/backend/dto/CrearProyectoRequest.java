package com.Votify.backend.dto;

import java.util.List;
import java.util.UUID;

import lombok.Data;

@Data
public class CrearProyectoRequest {

    private String nombre;
    private String descripcion;
    private String tipoCategoria;
    private String nombreEquipo;
    private List<String> miembrosEmails;
    private UUID eventoId;
    
}
