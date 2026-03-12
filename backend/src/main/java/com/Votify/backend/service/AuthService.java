package com.Votify.backend.service;

import org.springframework.stereotype.Service;

import com.Votify.backend.dto.AuthLoginRequest;
import com.Votify.backend.dto.AuthRegisterRequest;
import com.Votify.backend.dto.AuthResponse;
import com.Votify.backend.model.Rol;
import com.Votify.backend.model.Usuario;
import com.Votify.backend.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class AuthService {
    private final UsuarioRepository usuarioRepository;

    public AuthResponse register(AuthRegisterRequest request){
            usuarioRepository.findByEmail(request.getEmail()).ifPresent(usuario ->{
                throw new RuntimeException("Ya existe un usuario con ese email.");
            });

            Usuario usuario = new Usuario();
            usuario.setNombre(request.getNombre());
            usuario.setEmail(request.getEmail());
            usuario.setPassword(request.getPassword());
            usuario.setRol(Rol.PUBLICO); // Por defecto lo dejo publico, luego el organizador cambia los roles

            Usuario guardado = usuarioRepository.save(usuario);
            return new AuthResponse(
                guardado.getId(), 
                guardado.getNombre(), 
                guardado.getEmail(), 
                guardado.getRol()
            );
    }

    public AuthResponse login(AuthLoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Credenciales incorrectas."));

        if (!usuario.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Credenciales incorrectas.");
        }

        return new AuthResponse(
            usuario.getId(),
            usuario.getNombre(),
            usuario.getEmail(),
            usuario.getRol()
        );
    }
    
}
