package com.Votify.backend.chainOfResponsability;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.VotoRequest;
import com.Votify.backend.repository.VotacionProyectoRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ValidadorVotacionProyectoExiste extends ValidadorVotoBase {
    
    private final VotacionProyectoRepository votacionProyectoRepository;
    
    @Override
    protected void ejecutarValidacion(VotoRequest request) {
        if (request.votacionProyectoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "VotacionProyecto es obligatorio");
        }
        
        if (!votacionProyectoRepository.existsById(request.votacionProyectoId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "VotacionProyecto no encontrado");
        }
    }
}
