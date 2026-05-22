package com.Votify.backend.chainOfResponsability;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.VotoRequest;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.repository.VotacionRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ValidadorVotacionAbierta extends ValidadorVotoBase {
    
    private final VotacionRepository votacionRepository;
    
    @Override
    protected void ejecutarValidacion(VotoRequest request) {
        VotacionMO votacion = votacionRepository.findById(request.votacionId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Votación no encontrada"));
        
        if (votacion.getEstadoActual() != EstadoVotacionMO.ABIERTA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                "La votación no está abierta");
        }
    }
}
