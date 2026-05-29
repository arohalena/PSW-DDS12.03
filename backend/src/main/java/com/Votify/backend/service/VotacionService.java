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
    private final VotacionDeletionService votacionDeletionService;

    @Override
    protected JpaRepository<VotacionMO, UUID> getRepository() {
        return votacionRepository;
    }

    public List<VotacionMO> findByEvento_Id(UUID eventoId) {
        return votacionRepository.findByEvento_Id(eventoId);
    }

    @Transactional
    public VotacionMO crear(CrearVotacionRequest request) {
        validarRequestCreacion(request);

        EventoMO evento = eventoRepository.findById(request.eventoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        validarFechas(request.inicio(), request.fin());
        
        boolean esMulticriterio = esModalidadMulticriterio(request.modalidad());
        
        boolean esPonderada = esModalidadPonderada(request.modalidad());

        if (esMulticriterio) {
            List<CriterioEvaluacionMO> criteriosExistentes = criterioEvaluacionRepository
                .findByEvento_IdOrderByOrdenAsc(evento.getId());

            if (criteriosExistentes.isEmpty() || esPonderada) {
                validarCriterios(request.criterios(), esPonderada);
            } 

            sincronizarCriterios(evento, request, esPonderada, criteriosExistentes);
        }

        VotacionMO guardada = votacionRepository.save(construirVotacion(request, evento));

        return guardada;
    }

    private void validarRequestCreacion(CrearVotacionRequest request) {
        if (request.eventoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El evento es requerido");
        }

        if (request.nombre() == null || request.nombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la votación es requerido");
        }

        if (request.tipo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo de votación es requerido");
        }

        if (request.modalidad() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La modalidad de votación es requerida");
        }

        if (request.tipo() == com.Votify.backend.model.TipoVotacionMO.MIXTA) {
            Integer popular = request.pesoPorcentajePopular();
            Integer jurado  = request.pesoPorcentajeJurado();
            if (popular == null || jurado == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Para votación MIXTA debes especificar el peso porcentual de popular y jurado.");
            }
            if (popular < 0 || popular > 100 || jurado < 0 || jurado > 100) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Los porcentajes deben estar entre 0 y 100.");
            }
            if (popular + jurado != 100) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Los porcentajes de popular y jurado deben sumar exactamente 100.");
            }
        }
    }

    private void validarFechas(OffsetDateTime inicio, OffsetDateTime fin) {
        if (inicio != null && fin != null && inicio.isAfter(fin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La fecha de fin debe ser posterior a la fecha de inicio");
        }
    }

    private boolean esModalidadMulticriterio(ModalidadVotacionMO modalidad) {
        return modalidad == ModalidadVotacionMO.MULTICRITERIO || modalidad == ModalidadVotacionMO.MULTICRITERIO_PONDERADA;
    }

    private boolean esModalidadPonderada(ModalidadVotacionMO modalidad) {
        return modalidad == ModalidadVotacionMO.MULTICRITERIO_PONDERADA;
    }

    private void sincronizarCriterios(EventoMO evento, CrearVotacionRequest request, boolean esPonderada, List<CriterioEvaluacionMO> criteriosExistentes) {
        if (request.criterios() == null) {
            return;
        }

        if (criteriosExistentes.isEmpty()) {
            crearCriterios(evento, request.criterios(), esPonderada);
            return;
        }

        if (esPonderada) {
            actualizarPesosDeCriterios(request.criterios(), criteriosExistentes);
        }
    }

    private VotacionMO construirVotacion(CrearVotacionRequest request, EventoMO evento) {
        VotacionMO votacion = new VotacionMO();
        votacion.setEvento(evento);
        votacion.setTipo(request.tipo());
        votacion.setModalidad(request.modalidad());
        votacion.setMaxSelecciones(request.maxSelecciones());
        votacion.setInicio(request.inicio());
        votacion.setFin(request.fin());
        votacion.setComentariosActivos(request.comentariosActivos() == null || request.comentariosActivos());
        votacion.setComentarioObligatorio( votacion.isComentariosActivos() && request.comentarioObligatorio() != null
                && request.comentarioObligatorio());
        votacion.setNombre(request.nombre().trim());
        votacion.setEstado(request.estado() != null ? request.estado() : EstadoVotacionMO.PENDIENTE);

        if (request.tipo() == com.Votify.backend.model.TipoVotacionMO.MIXTA) {
            votacion.setPesoPorcentajePopular(request.pesoPorcentajePopular());
            votacion.setPesoPorcentajeJurado(request.pesoPorcentajeJurado());
        }

        return votacion;
    }

    private void crearCriterios(EventoMO evento, List<CriterioEvaluacionRequest> criterios, boolean esPonderada) {
        int orden = 1;

        for (CriterioEvaluacionRequest criterioReq : criterios) {
            CriterioEvaluacionMO criterio = new CriterioEvaluacionMO();
            criterio.setEvento(evento);
            criterio.setNombre(criterioReq.nombre().trim());
            criterio.setDescripcion(criterioReq.descripcion());

            BigDecimal peso = esPonderada ? criterioReq.peso() : BigDecimal.ONE;
            criterio.setPeso(peso.intValue());
            criterio.setOrden(orden++);

            criterioEvaluacionRepository.save(criterio);
        }
    }

    private void actualizarPesosDeCriterios(List<CriterioEvaluacionRequest> criteriosRequest, List<CriterioEvaluacionMO> criteriosExistentes) {
        for (CriterioEvaluacionRequest criterioReq : criteriosRequest) {
            if (criterioReq.nombre() == null || criterioReq.peso() == null) continue;

            String nombreReq = criterioReq.nombre().trim();

            criteriosExistentes.stream()
                .filter(c -> c.getNombre().equalsIgnoreCase(nombreReq))
                .findFirst()
                .ifPresent(c -> {
                    c.setPeso(criterioReq.peso().intValue());
                    criterioEvaluacionRepository.save(c);
                });
        }
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
        v.abrir();
        return votacionRepository.save(v);
    }

    @Transactional
    public VotacionMO pausar(UUID id) {
        VotacionMO v = findById(id);
        v.pausar();
        return votacionRepository.save(v);
    }

    @Transactional
    public VotacionMO reanudar(UUID id) {
        VotacionMO v = findById(id);
        v.reanudar();
        return votacionRepository.save(v);
    }

    @Transactional
    public VotacionMO cerrar(UUID id) {
        VotacionMO v = findById(id);
        v.cerrar();
        return votacionRepository.save(v);
    }

    @Transactional
    public VotacionMO publicarResultados(UUID id) {
        VotacionMO v = findById(id);
        v.verificarExpiracion();
        v.publicarResultados();
        return votacionRepository.save(v);
    }

    @Transactional
    public VotacionMO retirarPublicacionResultados(UUID id) {
        VotacionMO v = findById(id);
        v.setResultadosPublicados(false);
        v.setFechaPublicacionResultados(null);
        return votacionRepository.save(v);
    }
    
    @Transactional
    public int aplicarTransicionesAutomaticas() {
        int cambios = 0;
        for (VotacionMO v : votacionRepository.findAll()) {
            if (v.aplicarTransicionPorFechas()) {
                votacionRepository.save(v);
                cambios++;
            }
        }
        return cambios;
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        votacionDeletionService.eliminar(id);
    }

    @Transactional
    public void eliminarTodasDeEvento(UUID eventoId) {
        votacionDeletionService.eliminarTodasDeEvento(eventoId);
    }

    public void validarVotacionesDelEvento(List<UUID> votacionIds, UUID eventoId) {

        if (votacionIds == null || votacionIds.isEmpty()) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Si eliges un evento, debes elegir al menos una votación.");

        }

        for (UUID votacionId : votacionIds) {

            VotacionMO votacion = votacionRepository.findById(votacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Votación no encontrada."));

            if (!votacion.getEvento().getId().equals(eventoId)) {
                
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Todas las votaciones deben pertenecer al evento seleccionado.");
            }

        }
        
    }
}