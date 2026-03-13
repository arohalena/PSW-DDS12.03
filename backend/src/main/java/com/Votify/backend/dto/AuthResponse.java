package com.Votify.backend.dto;

import java.util.UUID;

import com.Votify.backend.model.RolMO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private UUID id;
    private String nombre;
    private String email;
    private RolMO rol;
}
