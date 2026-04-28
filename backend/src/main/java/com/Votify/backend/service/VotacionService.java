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
    private EventoService eventoService;

    @Override
    protected JpaRepository<VotacionMO, UUID> getRepository() {
        return votacionRepository;
    }

    public List<VotacionMO> findByEvento_Id(UUID eventoId) {
        return votacionRepository.findByEvento_Id(eventoId);
    }

    @Transactional
    public VotacionMO crear(CrearVotacionRequest request) {
        if (request.eventoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El evento es requerido");
        }

        EventoMO evento = eventoRepository.findById(request.eventoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        if (request.tipo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo de votación es requerido");
        }

        if (request.modalidad() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La modalidad de votación es requerida");
        }

        OffsetDateTime inicio = request.inicio();
        OffsetDateTime fin = request.fin();

        if (inicio != null && fin != null && inicio.isAfter(fin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de fin debe ser posterior a la fecha de inicio");
        }

        boolean esMulticriterio =
            request.modalidad() == ModalidadVotacionMO.MULTICRITERIO ||
            request.modalidad() == ModalidadVotacionMO.MULTICRITERIO_PONDERADA;

        boolean esPonderada =
            request.modalidad() == ModalidadVotacionMO.MULTICRITERIO_PONDERADA;

        if (esMulticriterio) {
            List<CriterioEvaluacionMO> criteriosExistentes = criterioEvaluacionRepository
                .findByEvento_IdOrderByOrdenAsc(evento.getId());

            if (criteriosExistentes.isEmpty()) {
                validarCriterios(request.criterios(), esPonderada);
            }
        }

        VotacionMO votacion = new VotacionMO();
        votacion.setEvento(evento);
        votacion.setTipo(request.tipo());
        votacion.setModalidad(request.modalidad());
        votacion.setMaxSelecciones(eventoService.getNumProyectosPorVoto(request.eventoId()));
        votacion.setInicio(request.inicio());
        votacion.setFin(request.fin());
        votacion.setEstado(request.estado() != null ?
        request.estado() : EstadoVotacionMO.PENDIENTE);

        VotacionMO guardada = votacionRepository.save(votacion);

        if (esMulticriterio) {
            List<CriterioEvaluacionMO> criteriosExistentes = criterioEvaluacionRepository
                .findByEvento_IdOrderByOrdenAsc(evento.getId());

            if (criteriosExistentes.isEmpty() && request.criterios() != null) {
                int orden = 1;

                for (CriterioEvaluacionRequest criterioReq : request.criterios()) {
                    CriterioEvaluacionMO criterio = new CriterioEvaluacionMO();
                    criterio.setEvento(evento);
                    criterio.setNombre(criterioReq.nombre().trim());
                    criterio.setDescripcion(criterioReq.descripcion());

                    BigDecimal peso = esPonderada
                        ? criterioReq.peso()
                        : BigDecimal.ONE;

                    criterio.setPeso(peso.intValue());
                    criterio.setOrden(orden++);

                    criterioEvaluacionRepository.save(criterio);
                }
            }
        }

        return guardada;
    }

    private void validarCriterios(List<CriterioEvaluacionRequest> criterios, boolean ponderada) {
        if (criterios == null || criterios.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes añadir al menos un criterio.");
        }

        BigDecimal total = BigDecimal.ZERO;

        for (CriterioEvaluacionRequest criterio : criterios) {
            if (criterio.nombre() == null || criterio.nombre().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos los criterios deben tener nombre.");
            }

            if (ponderada) {
                if (criterio.peso() == null || criterio.peso().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos los criterios ponderados deben tener un peso mayor a 0.");
                }

                total = total.add(criterio.peso());
            }
        }

        if (ponderada && total.compareTo(new BigDecimal("100")) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La suma de los pesos debe ser exactamente 100%.");
        }
    }

    @Transactional
    public VotacionMO abrir(UUID id) {

        VotacionMO v = findById(id);

        v.setEstado(EstadoVotacionMO.ABIERTA);

        return votacionRepository.save(v);

    }

    @Transactional
    public VotacionMO pausar(UUID id) {

        VotacionMO v = findById(id);

        if (v.getEstado() == EstadoVotacionMO.CERRADA) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                 "No se puede pausar una votación cerrada."
                );

        }

        v.setEstado(EstadoVotacionMO.PAUSADA);
        return votacionRepository.save(v);

    }

    @Transactional
    public VotacionMO reanudar(UUID id) {

        VotacionMO v = findById(id);

        if (v.getEstado() != EstadoVotacionMO.PAUSADA) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                 "Solo se puede reanudar una votación pausada."
                );

        }

        v.setEstado(EstadoVotacionMO.ABIERTA);
        return votacionRepository.save(v);

    }

    @Transactional
    public VotacionMO cerrar(UUID id) {

        VotacionMO v = findById(id);

        v.setEstado(EstadoVotacionMO.CERRADA);

        return votacionRepository.save(v);

    }

    @Transactional
    public int aplicarTransicionesAutomaticas() {

        OffsetDateTime ahora = OffsetDateTime.now();

        int cambios = 0;

        for (VotacionMO v : votacionRepository.findAll()) {

            EstadoVotacionMO actual = v.getEstado();

            if (v.getFin() != null && ahora.isAfter(v.getFin())
                    && actual != EstadoVotacionMO.CERRADA) {

                v.setEstado(EstadoVotacionMO.CERRADA);
                votacionRepository.save(v);

                cambios++;
                continue;
            }

            if (actual == EstadoVotacionMO.PENDIENTE
                    && v.getInicio() != null
                    && !ahora.isBefore(v.getInicio())
                    && (v.getFin() == null || ahora.isBefore(v.getFin()))) {

                v.setEstado(EstadoVotacionMO.ABIERTA);
                votacionRepository.save(v);

                cambios++;

            }
        }

        return cambios;
        
    }    
}
