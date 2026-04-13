package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.EventoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CriterioEvaluacionService extends GenericService<CriterioEvaluacionMO> {

    private final CriterioEvaluacionRepository criterioRepository;
    private final EventoRepository eventoRepository;

    @Override
    protected JpaRepository<CriterioEvaluacionMO, UUID> getRepository() {

        return criterioRepository;

    }

    public List<CriterioEvaluacionMO> findByEventoId(UUID eventoId) {

        return criterioRepository.findByEvento_IdOrderByAsc(eventoId);

    }

    public CriterioEvaluacionMO crear(CriterioEvaluacionMO criterio) {

        if (criterio.getEvento() == null || criterio.getEvento().getId() == null) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El evento es requerido"
            );

        }

        EventoMO evento = eventoRepository.findById(criterio.getEvento().getId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Evento no encontrado"
                ));

        if (criterio.getNombre() == null || criterio.getNombre().isBlank()) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El nombre del criterio es requerido"
            );

        }

        if (criterio.getPeso() <= 0 || criterio.getPeso() > 100) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El peso debe estar entre 1 y 100");

        }

        criterio.setEvento(evento);

        return criterioRepository.save(criterio);

    }

    public CriterioEvaluacionMO actualizar(UUID id, CriterioEvaluacionMO datos) {

        CriterioEvaluacionMO existente = findById(id);

        if (datos.getNombre() != null && !datos.getNombre().isBlank()) {

            existente.setNombre(datos.getNombre());

        }
        if (datos.getPeso() > 0) {

            existente.setPeso(datos.getPeso());

        }
        if (datos.getDescripcion() != null) {

            existente.setDescripcion(datos.getDescripcion());

        }

        existente.setEscalaMin(datos.getEscalaMin());
        existente.setEscalaMax(datos.getEscalaMax());
        existente.setOrden(datos.getOrden());

        return criterioRepository.save(existente);

    }

    public void deleteAllByEventoId(UUID eventoId) {

        List<CriterioEvaluacionMO> criterios = findByEventoId(eventoId);

        criterioRepository.deleteAll(criterios);
        
    }
}
