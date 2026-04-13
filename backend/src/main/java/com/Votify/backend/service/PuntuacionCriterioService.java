package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.PuntuacionCriterioMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PuntuacionCriterioService extends GenericService<PuntuacionCriterioMO> {

    private final PuntuacionCriterioRepository puntuacionRepository;
    private final CriterioEvaluacionRepository criterioRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;

    @Override
    protected JpaRepository<PuntuacionCriterioMO, UUID> getRepository() {

        return puntuacionRepository;

    }

    public PuntuacionCriterioMO puntuar(PuntuacionCriterioMO puntuacion) {

        if (puntuacion.getCriterio() == null || puntuacion.getCriterio().getId() == null) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El criterio es requerido"
            );

        }

        if (puntuacion.getVotacionProyecto() == null || puntuacion.getVotacionProyecto().getId() == null) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El proyecto de votación es requerido"
            );
        }

        if (puntuacion.getAnonTokenHash() == null || puntuacion.getAnonTokenHash().isBlank()) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El token es requerido"
            );

        }

        CriterioEvaluacionMO criterio = criterioRepository.findById(puntuacion.getCriterio().getId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Criterio no encontrado"
                ));

        VotacionProyectoMO vp = votacionProyectoRepository.findById(puntuacion.getVotacionProyecto().getId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Votación-proyecto no encontrado"
                ));

        if (puntuacion.getPuntuacion() < criterio.getEscalaMin() || puntuacion.getPuntuacion() > criterio.getEscalaMax()) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                    "La puntuación debe estar entre " + criterio.getEscalaMin() + " y " + criterio.getEscalaMax()
                );

        }

        var existente = puntuacionRepository.findByCriterio_IdAndVotacionProyecto_IdAndAnonTokenHash(criterio.getId(), vp.getId(), puntuacion.getAnonTokenHash());

        if (existente.isPresent()) {

            PuntuacionCriterioMO p = existente.get();

            p.setPuntuacion(puntuacion.getPuntuacion());

            return puntuacionRepository.save(p);

        }

        puntuacion.setCriterio(criterio);
        puntuacion.setVotacionProyecto(vp);

        return puntuacionRepository.save(puntuacion);

    }

    public List<PuntuacionCriterioMO> findByVotacionProyectoId(UUID vpId) {

        return puntuacionRepository.findByVotacionProyecto_Id(vpId);

    }

    public Double getPromedio(UUID criterioId, UUID vpId) {

        return puntuacionRepository.promedioByCriterioAndVotacionProyecto(criterioId, vpId);

    }
}
