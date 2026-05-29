package com.Votify.backend.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotacionDeletionService {

    private final VotacionRepository votacionRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final ComentarioRepository comentarioRepository;
    private final PuntuacionCriterioRepository puntuacionCriterioRepository;
    private final VotoRepository votoRepository;
    private final VotoCriterioRepository votoCriterioRepository;

    @Transactional
    public void eliminar(UUID id) {
        VotacionMO votacion = votacionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Votación no encontrada."));

        validarVotacionSinVotos(id);

        for (var votacionProyecto : votacionProyectoRepository.findByVotacion_Id(id)) {
            comentarioRepository.deleteAll(
                comentarioRepository.findByVotacionProyecto_Id(votacionProyecto.getId())
            );

            puntuacionCriterioRepository.deleteAll(
                puntuacionCriterioRepository.findByVotacionProyecto_Id(votacionProyecto.getId())
            );

            for (VotoMO voto : votoRepository.findByVotacionProyecto_Id(votacionProyecto.getId())) {
                votoCriterioRepository.deleteAll(
                    votoCriterioRepository.findByVoto_Id(voto.getId())
                );

                votoRepository.delete(voto);
            }

            votacionProyectoRepository.delete(votacionProyecto);
        }

        votacionRepository.delete(votacion);
    }

    public boolean tieneVotos(UUID id) {
        return votoRepository.countByVotacionProyecto_Votacion_Id(id) > 0;
    }

    public void validarVotacionSinVotos(UUID id) {
        if (tieneVotos(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No se puede eliminar una votacion con votos emitidos. Los votos son inmutables.");
        }
    }

    public void validarEventoSinVotos(UUID eventoId) {
        for (VotacionMO votacion : votacionRepository.findByEvento_Id(eventoId)) {
            if (tieneVotos(votacion.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar un evento con votaciones que ya tienen votos emitidos.");
            }
        }
    }

    @Transactional
    public void eliminarTodasDeEvento(UUID eventoId) {
        validarEventoSinVotos(eventoId);

        for (VotacionMO votacion : votacionRepository.findByEvento_Id(eventoId)) {
            eliminar(votacion.getId());
        }
    }
}