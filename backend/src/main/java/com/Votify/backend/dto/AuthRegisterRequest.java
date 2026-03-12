package com.Votify.backend.dto;

import lombok.Data;
@Data
public class AuthRegisterRequest {
    private String nombre;
    private String email;
    private String password;
}
