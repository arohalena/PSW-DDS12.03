package com.Votify.backend.chainOfResponsability;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.VotoRequest;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.repository.VotoRepository;
import com.Votify.backend.repository.VotacionRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ValidadorMaximoYDuplicado extends ValidadorVotoBase {

    private final VotacionRepository votacionRepository;
    private final VotoRepository votoRepository;

    @Override
    protected void ejecutarValidacion(VotoRequest request) {
        String anon = request.anonTokenHash();
        if (anon == null || anon.isBlank()) return;

        VotacionMO votacion = votacionRepository.findById(request.votacionId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Votación no encontrada"));

        long emitidos = votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(
            votacion.getId(), anon
        );

        if (emitidos >= votacion.getMaxSelecciones()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Se ha alcanzado el número máximo de votos para este token.");
        }

        boolean yaVoto = votoRepository.existsByVotacionProyecto_IdAndAnonTokenHash(
            request.votacionProyectoId(), anon
        );

        if (yaVoto) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya has votado en este proyecto");
        }
    }
}
