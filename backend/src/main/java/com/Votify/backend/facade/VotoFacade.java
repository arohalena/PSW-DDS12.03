package com.Votify.backend.facade;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.EmitirEvaluacionRequest;
import com.Votify.backend.dto.EmitirVotoPuntosRequest;
import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.dto.PuntuacionCriterioRequest;
import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.PuntuacionCriterioMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoCriterioMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.service.ComentarioService;
import com.Votify.backend.service.CriterioEvaluacionService;
import com.Votify.backend.service.PuntuacionCriterioService;
import com.Votify.backend.service.VotacionProyectoService;
import com.Votify.backend.service.VotoCriterioService;
import com.Votify.backend.service.VotoService;
import com.Votify.backend.service.UsuarioService;
import com.Votify.backend.model.UsuarioMO;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class VotoFacade {

    private final VotoService votoService;
    private final VotacionProyectoService votacionProyectoService;
    private final UsuarioService usuarioService;
    private final CriterioEvaluacionService criterioEvaluacionService;
    private final PuntuacionCriterioService puntuacionCriterioService;
    private final VotoCriterioService votoCriterioService;
    private final ComentarioService comentarioService;

    @Transactional
    public VotoMO votarSimple(EmitirVotoSimpleRequest request) {
        VotacionProyectoMO vp = votacionProyectoService.obtener(request.votacionProyectoId());
        votoService.validarVoto(
            request.usuarioId(),
            vp.getVotacion().getId(),
            request.votacionProyectoId(),
            request.anonTokenHash(),
            request.comentario()
        );

        UsuarioMO usuario = request.usuarioId() != null ? usuarioService.obtener(request.usuarioId()) : null;

        VotoMO guardado = votoService.save(
            new VotoMO(vp, request.anonTokenHash(), usuario, BigDecimal.ONE)
        );

        comentarioService.guardarComentarioGlobal(vp, request.anonTokenHash(), request.comentario());

        return guardado;
    }

    @Transactional
    public VotoMO votarPuntos(EmitirVotoPuntosRequest request) {
        if (request.puntuacion() == null || request.puntuacion() < 1 || request.puntuacion() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La puntuación debe estar entre 1 y 10.");
        }

        VotacionProyectoMO vp = votacionProyectoService.obtener(request.votacionProyectoId());
        votoService.validarVoto(
            request.usuarioId(),
            vp.getVotacion().getId(),
            request.votacionProyectoId(),
            request.anonTokenHash(),
            request.comentario()
        );

        UsuarioMO usuario = request.usuarioId() != null ? usuarioService.obtener(request.usuarioId()) : null;

        VotoMO guardado = votoService.save(
            new VotoMO(vp, request.anonTokenHash(), usuario, BigDecimal.valueOf(request.puntuacion()))
        );

        if (request.comentario() != null && !request.comentario().isBlank()) {
            comentarioService.guardarComentarioGlobal(vp, request.anonTokenHash(), request.comentario());
        }

        return guardado;
    }

    @Transactional
    public VotoMO votarMulticriterio(EmitirEvaluacionRequest request) {
        VotacionProyectoMO vp = votacionProyectoService.obtener(request.votacionProyectoId());
        votoService.validarVoto(
            request.usuarioId(),
            vp.getVotacion().getId(),
            request.votacionProyectoId(),
            request.anonTokenHash(),
            request.comentario()
        );

        VotacionMO votacion = vp.getVotacion();
        List<CriterioEvaluacionMO> criterios = criterioEvaluacionService.findByEventoId(votacion.getEvento().getId());
        if (criterios.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no tiene criterios configurados.");
        }
        if (request.puntuaciones() == null || request.puntuaciones().size() != criterios.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes puntuar todos los criterios.");
        }

        Map<UUID, CriterioEvaluacionMO> criteriosMap = criterios.stream()
            .collect(Collectors.toMap(CriterioEvaluacionMO::getId, Function.identity()));

        for (PuntuacionCriterioRequest pr : request.puntuaciones()) {
            if (pr.criterioId() == null || !criteriosMap.containsKey(pr.criterioId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se ha enviado un criterio no válido.");
            }
            if (pr.puntuacion() == null || pr.puntuacion() < 1 || pr.puntuacion() > 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada criterio debe puntuarse entre 1 y 5.");
            }
        }

        Map<UUID, PuntuacionCriterioRequest> puntuacionesRequestMap = request.puntuaciones().stream()
            .collect(Collectors.toMap(
                PuntuacionCriterioRequest::criterioId,
                Function.identity(),
                (a, b) -> { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes repetir criterios."); }
            ));

        Map<UUID, Integer> puntuacionesMap = puntuacionesRequestMap.entrySet().stream()
            .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().puntuacion()));

        BigDecimal total = BigDecimal.ZERO;
        for (CriterioEvaluacionMO c : criterios) {
            int p = puntuacionesMap.get(c.getId());
            BigDecimal parcial = (votacion.getModalidad() == ModalidadVotacionMO.MULTICRITERIO_PONDERADA)
                ? BigDecimal.valueOf(p).multiply(BigDecimal.valueOf(c.getPeso()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(p);
            total = total.add(parcial);
        }
        if (votacion.getModalidad() == ModalidadVotacionMO.MULTICRITERIO) {
            total = total.divide(BigDecimal.valueOf(criterios.size()), 2, RoundingMode.HALF_UP);
        }
        VotoMO guardado = votoService.save(
            new VotoMO(vp, request.anonTokenHash(), usuarioService.obtener(request.usuarioId()), total)
        );

        for (CriterioEvaluacionMO c : criterios) {
            VotoCriterioMO vc = new VotoCriterioMO();
            vc.setVoto(guardado);
            vc.setCriterio(c);
            vc.setPuntuacion(puntuacionesMap.get(c.getId()));
            votoCriterioService.save(vc);

            PuntuacionCriterioMO pc = new PuntuacionCriterioMO();
            pc.setCriterio(c);
            pc.setVotacionProyecto(vp);
            pc.setAnonTokenHash(request.anonTokenHash());
            pc.setPuntuacion(puntuacionesMap.get(c.getId()));
            puntuacionCriterioService.save(pc);

            PuntuacionCriterioRequest pr = puntuacionesRequestMap.get(c.getId());
            if (votacion.isComentariosActivos() && pr != null && pr.comentario() != null && !pr.comentario().isBlank()) {
                ComentarioMO com = new ComentarioMO();
                com.setAnonTokenHash(request.anonTokenHash());
                com.setVotacionProyecto(vp);
                com.setProyecto(vp.getProyecto());
                com.setCriterio(c);
                com.setTexto(pr.comentario().trim());
                comentarioService.save(com);
            }
        }

        comentarioService.guardarComentarioGlobal(vp, request.anonTokenHash(), request.comentario());

        return guardado;
    }

    public boolean haAlcanzadoMaximo(UUID votacionId, String anonTokenHash) {
        if (anonTokenHash == null || anonTokenHash.isBlank()) return false;

        VotacionProyectoMO cualquier = votacionProyectoService.findByVotacion_Id(votacionId).stream()
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la votación."));

        return votoService.haAlcanzadoMaximo(cualquier, anonTokenHash);
    }

    public List<VotoMO> findAll() {
        return votoService.findAll();
    }

    public VotoMO findById(UUID id) {
        return votoService.findById(id);
    }

    public List<VotoMO> findByVotacionProyecto_Id(UUID votacionProyectoId) {
        return votoService.findByVotacionProyecto_Id(votacionProyectoId);
    }

    public long contarVotosPorVotacionProyecto(UUID votacionProyectoId) {
        return votoService.contarVotosPorVotacionProyecto(votacionProyectoId);
    }

    public boolean yaHaVotado(UUID votacionProyectoId, String token) {
        return votoService.yaHaVotado(votacionProyectoId, token);
    }

    public long contarVotantesUnicos(UUID eventoId) {
        return votoService.contarVotantesUnicos(eventoId);
    }
}