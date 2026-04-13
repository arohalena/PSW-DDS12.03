package com.Votify.backend.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.CrearVotacionRequest;
import com.Votify.backend.dto.CriterioEvaluacionRequest;
import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.VotacionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotacionService extends GenericService<VotacionMO> {

    private final VotacionRepository votacionRepository;
    private final EventoRepository eventoRepository;
    private final CriterioEvaluacionRepository criterioEvaluacionRepository;

    @Override
    protected JpaRepository<VotacionMO, UUID> getRepository() {
        return votacionRepository;
    }

    public List<VotacionMO> findByEvento_Id(UUID eventoId) {
        return votacionRepository.findByEvento_Id(eventoId);
    }

    @Transactional
    public VotacionMO crear(CrearVotacionRequest request) {
        if (request.getEventoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El evento es requerido");
        }

        EventoMO evento = eventoRepository.findById(request.getEventoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        if (request.getTipo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo de votación es requerido");
        }

        if (request.getModalidad() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La modalidad de votación es requerida");
        }

        if (request.getMaxSelecciones() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número máximo de selecciones debe ser mayor a 0");
        }

        OffsetDateTime inicio = request.getInicio();
        OffsetDateTime fin = request.getFin();

        if (inicio != null && fin != null && inicio.isAfter(fin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de fin debe ser posterior a la fecha de inicio");
        }

        if (request.getModalidad() == ModalidadVotacionMO.MULTICRITERIO) {
            // Comprobar si ya existen criterios para este evento (creados desde el sidebar)
            List<CriterioEvaluacionMO> criteriosExistentes = criterioEvaluacionRepository
                .findByEvento_IdOrderByOrdenAsc(evento.getId());

            if (criteriosExistentes.isEmpty()) {
                // No hay criterios del sidebar → deben venir en el request
                validarCriterios(request.getCriterios());
            }
            // Si ya existen criterios del sidebar, no pedimos ni creamos nuevos
        }

        VotacionMO votacion = new VotacionMO();
        votacion.setEvento(evento);
        votacion.setTipo(request.getTipo());
        votacion.setModalidad(request.getModalidad());
        votacion.setMaxSelecciones(request.getMaxSelecciones());
        votacion.setInicio(request.getInicio());
        votacion.setFin(request.getFin());
        votacion.setEstado(request.getEstado() != null ? request.getEstado() : EstadoVotacionMO.CERRADA);

        VotacionMO guardada = votacionRepository.save(votacion);

        if (request.getModalidad() == ModalidadVotacionMO.MULTICRITERIO) {
            int orden = 1;
            for (CriterioEvaluacionRequest criterioReq : request.getCriterios()) {
                CriterioEvaluacionMO criterio = new CriterioEvaluacionMO();
                criterio.setEvento(evento);
                criterio.setNombre(criterioReq.getNombre().trim());
                criterio.setDescripcion(criterioReq.getDescripcion());
                criterio.setPeso(criterioReq.getPeso().intValue());
                criterio.setOrden(orden++);
                criterioEvaluacionRepository.save(criterio);
            }
        }

        return guardada;
    }

    private void validarCriterios(List<CriterioEvaluacionRequest> criterios) {
        if (criterios == null || criterios.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes añadir al menos un criterio.");
        }

        BigDecimal total = BigDecimal.ZERO;

        for (CriterioEvaluacionRequest criterio : criterios) {
            if (criterio.getNombre() == null || criterio.getNombre().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos los criterios deben tener nombre.");
            }

            if (criterio.getPeso() == null || criterio.getPeso().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos los criterios deben tener un peso mayor a 0.");
            }

            total = total.add(criterio.getPeso());
        }

        if (total.compareTo(new BigDecimal("100")) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La suma de los pesos debe ser exactamente 100%.");
        }
    }
}
