package com.Votify.backend.dto;

import java.util.List;
import java.util.UUID;

import com.Votify.backend.model.TipoCategoriaMO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProyectoGestionViewDTO {
    private UUID id;
    private String nombre;
    private String descripcion;
    private TipoCategoriaMO tipoCategoria;
    private RefDTO equipo;       
    private RefDTO evento;       
    private List<VotacionRefDTO> votaciones;

    @Data @AllArgsConstructor
    public static class RefDTO {
        private UUID id;
        private String nombre;
    }

    @Data @AllArgsConstructor
    public static class VotacionRefDTO {
        private UUID relacionId;  
        private UUID votacionId;
        private String nombre;
        private String tipo;
        private String modalidad;
    }
}