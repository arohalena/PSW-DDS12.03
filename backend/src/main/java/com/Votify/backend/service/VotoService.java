package com.Votify.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.EmitirEvaluacionRequest;
import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.dto.PuntuacionCriterioRequest;
import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoCriterioMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class VotoService extends GenericService<VotoMO> {

    private final VotoRepository votoRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final CriterioEvaluacionRepository criterioEvaluacionRepository;
    private final VotoCriterioRepository votoCriterioRepository;
    private final ComentarioRepository comentarioRepository;

    @Override
    protected JpaRepository<VotoMO, UUID> getRepository() {
        return votoRepository;
    }

    public List<VotoMO> findByVotacionProyecto_Id(UUID votacionProyectoId) {
        return votoRepository.findByVotacionProyecto_Id(votacionProyectoId);
    }

    @Transactional
    public VotoMO votarSimple(EmitirVotoSimpleRequest request) {
        if (request.getVotacionProyectoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La opción de votación es obligatoria.");
        }

        if (request.getAnonTokenHash() == null || request.getAnonTokenHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token del votante es obligatorio.");
        }

        if (request.getComentario() == null || request.getComentario().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comentario es obligatorio.");
        }

        VotacionProyectoMO votacionProyecto = votacionProyectoRepository.findById(request.getVotacionProyectoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la opción de votación."));

        VotacionMO votacion = votacionProyecto.getVotacion();

        if (votacion.getModalidad() != ModalidadVotacionMO.SIMPLE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no es simple.");
        }

        validarEstadoYFechas(votacion);
        validarMaximoYDuplicado(votacion, votacionProyecto, request.getAnonTokenHash());

        VotoMO voto = new VotoMO();
        voto.setVotacionProyecto(votacionProyecto);
        voto.setAnonTokenHash(request.getAnonTokenHash());
        voto.setPuntuacionTotal(BigDecimal.ONE);

        VotoMO guardado = votoRepository.save(voto);

        ComentarioMO comentario = new ComentarioMO();
        comentario.setAnonTokenHash(request.getAnonTokenHash());
        comentario.setVotacionProyecto(votacionProyecto);
        comentario.setProyecto(votacionProyecto.getProyecto());
        comentario.setTexto(request.getComentario().trim());
        comentarioRepository.save(comentario);

        return guardado;
    }

    @Transactional
    public VotoMO votarMulticriterio(EmitirEvaluacionRequest request) {
        if (request.getVotacionProyectoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La opción de votación es obligatoria.");
        }

        if (request.getAnonTokenHash() == null || request.getAnonTokenHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token del votante es obligatorio.");
        }

        if (request.getComentario() == null || request.getComentario().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comentario es obligatorio.");
        }

        VotacionProyectoMO votacionProyecto = votacionProyectoRepository.findById(request.getVotacionProyectoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la opción de votación."));

        VotacionMO votacion = votacionProyecto.getVotacion();

        if (votacion.getModalidad() != ModalidadVotacionMO.MULTICRITERIO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no es multicriterio.");
        }

        validarEstadoYFechas(votacion);
        validarMaximoYDuplicado(votacion, votacionProyecto, request.getAnonTokenHash());

        List<CriterioEvaluacionMO> criterios = criterioEvaluacionRepository
            .findByVotacion_IdOrderByOrdenVisualAsc(votacion.getId());

        if (criterios.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no tiene criterios configurados.");
        }

        if (request.getPuntuaciones() == null || request.getPuntuaciones().size() != criterios.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes puntuar todos los criterios.");
        }

        Map<UUID, CriterioEvaluacionMO> criteriosMap = criterios.stream()
            .collect(Collectors.toMap(CriterioEvaluacionMO::getId, Function.identity()));

        for (PuntuacionCriterioRequest puntuacionReq : request.getPuntuaciones()) {
            if (puntuacionReq.getCriterioId() == null || !criteriosMap.containsKey(puntuacionReq.getCriterioId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se ha enviado un criterio no válido.");
            }

            if (puntuacionReq.getPuntuacion() == null || puntuacionReq.getPuntuacion() < 1 || puntuacionReq.getPuntuacion() > 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada criterio debe puntuarse entre 1 y 5.");
            }
        }

        Map<UUID, Integer> puntuacionesMap = request.getPuntuaciones().stream()
            .collect(Collectors.toMap(PuntuacionCriterioRequest::getCriterioId, PuntuacionCriterioRequest::getPuntuacion));

        BigDecimal total = BigDecimal.ZERO;

        for (CriterioEvaluacionMO criterio : criterios) {
            Integer puntuacion = puntuacionesMap.get(criterio.getId());

            if (puntuacion == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes puntuar todos los criterios.");
            }

            BigDecimal parcial = BigDecimal.valueOf(puntuacion)
                .multiply(criterio.getPeso())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            total = total.add(parcial);
        }

        VotoMO voto = new VotoMO();
        voto.setVotacionProyecto(votacionProyecto);
        voto.setAnonTokenHash(request.getAnonTokenHash());
        voto.setPuntuacionTotal(total);

        VotoMO guardado = votoRepository.save(voto);

        for (CriterioEvaluacionMO criterio : criterios) {
            VotoCriterioMO votoCriterio = new VotoCriterioMO();
            votoCriterio.setVoto(guardado);
            votoCriterio.setCriterio(criterio);
            votoCriterio.setPuntuacion(puntuacionesMap.get(criterio.getId()));
            votoCriterioRepository.save(votoCriterio);
        }

        ComentarioMO comentario = new ComentarioMO();
        comentario.setAnonTokenHash(request.getAnonTokenHash());
        comentario.setVotacionProyecto(votacionProyecto);
        comentario.setProyecto(votacionProyecto.getProyecto());
        comentario.setTexto(request.getComentario().trim());
        comentarioRepository.save(comentario);

        return guardado;
    }

    public long contarVotosPorVotacionProyecto(UUID votacionProyectoId) {
        return votoRepository.countByVotacionProyecto_Id(votacionProyectoId);
    }

    public boolean yaHaVotado(UUID votacionProyectoId, String anonTokenHash) {
        if (anonTokenHash == null || anonTokenHash.isBlank()) {
            return false;
        }
        return votoRepository.existsByVotacionProyecto_IdAndAnonTokenHash(votacionProyectoId, anonTokenHash);
    }

    public boolean haAlcanzadoMaximo(UUID votacionId, String anonTokenHash) {
        if (anonTokenHash == null || anonTokenHash.isBlank()) {
            return false;
        }

        VotacionProyectoMO cualquierRelacion = votacionProyectoRepository
            .findByVotacion_Id(votacionId)
            .stream()
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la votación."));

        VotacionMO votacion = cualquierRelacion.getVotacion();

        long votosEmitidos = votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(
            votacionId,
            anonTokenHash
        );

        return votosEmitidos >= votacion.getMaxSelecciones();
    }

    private void validarEstadoYFechas(VotacionMO votacion) {
        if (votacion.getEstado() != EstadoVotacionMO.ABIERTA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no está abierta.");
        }

        OffsetDateTime ahora = OffsetDateTime.now();

        if (votacion.getInicio() != null && ahora.isBefore(votacion.getInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación todavía no ha comenzado.");
        }

        if (votacion.getFin() != null && ahora.isAfter(votacion.getFin())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación ya ha finalizado.");
        }
    }

    private void validarMaximoYDuplicado(VotacionMO votacion, VotacionProyectoMO votacionProyecto, String anonTokenHash) {
        long votosEmitidos = votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(
            votacion.getId(),
            anonTokenHash
        );

        if (votosEmitidos >= votacion.getMaxSelecciones()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ya has alcanzado el número máximo de votos permitidos en esta votación.");
        }

        if (votoRepository.existsByVotacionProyecto_IdAndAnonTokenHash(votacionProyecto.getId(), anonTokenHash)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya habías votado este proyecto.");
        }
    }
}