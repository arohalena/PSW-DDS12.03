package com.Votify.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRegisterRequest (
    
    @NotBlank(message = "El  nombre es obligatorio.")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 carácteres.")
    String nombre,

    @NotBlank(message = "El correo es obligatorio.")
    @Email(message = "Introduce un correo válido (ej.nombre@dominio.com).")
    String email,

    @NotBlank(message = "La contraseña es obligatoria.")
    @Size(min = 4, message = "La contraseña debe tener al menos 4 carácteres.")
    String password
    
) {}
