package com.Votify.backend.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class ComentarioRequest {
    
    private UUID proyectoId;
    private String texto;

}
