package com.Votify.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.AuthLoginRequest;
import com.Votify.backend.dto.AuthRegisterRequest;
import com.Votify.backend.dto.AuthResponse;
import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class AuthService {
    private final UsuarioRepository usuarioRepository;

    public AuthResponse register(AuthRegisterRequest request){
            usuarioRepository.findByEmail(request.email()).ifPresent(usuario ->{
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Ya existe un usuario con ese email.");
            });

            UsuarioMO usuario = new UsuarioMO();
            usuario.setNombre(request.nombre());
            usuario.setEmail(request.email());
            usuario.setPassword(request.password());
            usuario.setRol(RolMO.PUBLICO); // Por defecto lo dejo publico, luego el organizador cambia los roles

            UsuarioMO guardado = usuarioRepository.save(usuario);
            return new AuthResponse(
                guardado.getId(), 
                guardado.getNombre(), 
                guardado.getEmail(), 
                guardado.getRol()
            );
    }

    public AuthResponse login(AuthLoginRequest request) {
        UsuarioMO usuario = usuarioRepository.findByEmail(request.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas."));

        if (!usuario.getPassword().equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Credenciales incorrectas.");
        }

        return new AuthResponse(
            usuario.getId(),
            usuario.getNombre(),
            usuario.getEmail(),
            usuario.getRol()
        );
    }
    
}
