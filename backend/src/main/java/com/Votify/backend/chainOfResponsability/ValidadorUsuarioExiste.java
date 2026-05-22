package com.Votify.backend.chainOfResponsability;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.VotoRequest;
import com.Votify.backend.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ValidadorUsuarioExiste extends ValidadorVotoBase {
    
    private final UsuarioRepository usuarioRepository;
    
    @Override
    protected void ejecutarValidacion(VotoRequest request) {
        if (request.usuarioId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Usuario es obligatorio");
        }
        
        if (!usuarioRepository.existsById(request.usuarioId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Usuario no encontrado");
        }
    }
}
