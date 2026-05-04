package com.Votify.backend.facade;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.PuntuacionCriterioMO;
import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoCriterioMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.service.CriterioEvaluacionService;
import com.Votify.backend.service.VotoService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class VotoFacade {

    private final VotoService votoService;
    private final CriterioEvaluacionService criterioEvaluacionService;

    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoCriterioRepository votoCriterioRepository;
    private final PuntuacionCriterioRepository puntuacionCriterioRepository;
    private final ComentarioRepository comentarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final CompetidorRepository competidorRepository;
    private final EquipoRepository equipoRepository;
    private final CompetidorEventoRepository competidorEventoRepository;

    @Transactional
    public VotoMO votarSimple(EmitirVotoSimpleRequest request) {
        validarRequestBase(request.votacionProyectoId(), request.anonTokenHash());

        VotacionProyectoMO vp = obtenerVotacionProyecto(request.votacionProyectoId());
        VotacionMO votacion = vp.getVotacion();
        exigirModalidad(votacion, ModalidadVotacionMO.SIMPLE);

        validarComentarios(votacion, request.comentario());

        UsuarioMO usuario = validarJuradoSiHaceFalta(votacion, request.usuarioId());
        validarEstadoYFechas(votacion);
        validarAutoVotacion(votacion, vp, request.usuarioId());
        validarMaximoYDuplicado(votacion, vp, request.anonTokenHash());

        VotoMO voto = new VotoMO();
        voto.setVotacionProyecto(vp);
        voto.setAnonTokenHash(request.anonTokenHash());
        voto.setUsuario(usuario);
        voto.setPuntuacionTotal(BigDecimal.ONE);
        VotoMO guardado = votoService.save(voto);

        guardarComentarioGlobal(vp, request.anonTokenHash(), request.comentario());

        return guardado;
    }

    @Transactional
    public VotoMO votarPuntos(EmitirVotoPuntosRequest request) {
        validarRequestBase(request.votacionProyectoId(), request.anonTokenHash());
        if (request.puntuacion() == null || request.puntuacion() < 1 || request.puntuacion() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La puntuación debe estar entre 1 y 10.");
        }

        VotacionProyectoMO vp = obtenerVotacionProyecto(request.votacionProyectoId());
        VotacionMO votacion = vp.getVotacion();
        exigirModalidad(votacion, ModalidadVotacionMO.PUNTOS);

        validarComentarios(votacion, request.comentario());

        UsuarioMO usuario = validarJuradoSiHaceFalta(votacion, request.usuarioId());
        validarEstadoYFechas(votacion);
        validarAutoVotacion(votacion, vp, request.usuarioId());
        validarMaximoYDuplicado(votacion, vp, request.anonTokenHash());

        VotoMO voto = new VotoMO();
        voto.setVotacionProyecto(vp);
        voto.setAnonTokenHash(request.anonTokenHash());
        voto.setUsuario(usuario);
        voto.setPuntuacionTotal(BigDecimal.valueOf(request.puntuacion()));
        VotoMO guardado = votoService.save(voto);

        if (request.comentario() != null && !request.comentario().isBlank()) {
            guardarComentarioGlobal(vp, request.anonTokenHash(), request.comentario());
        }

        return guardado;
    }

    @Transactional
    public VotoMO votarMulticriterio(EmitirEvaluacionRequest request) {
        validarRequestBase(request.votacionProyectoId(), request.anonTokenHash());

        VotacionProyectoMO vp = obtenerVotacionProyecto(request.votacionProyectoId());
        VotacionMO votacion = vp.getVotacion();

        validarComentarios(votacion, request.comentario());

        if (votacion.getModalidad() != ModalidadVotacionMO.MULTICRITERIO &&
            votacion.getModalidad() != ModalidadVotacionMO.MULTICRITERIO_PONDERADA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no es multicriterio.");
        }

        UsuarioMO usuario = validarJuradoSiHaceFalta(votacion, request.usuarioId());
        validarEstadoYFechas(votacion);
        validarAutoVotacion(votacion, vp, request.usuarioId());
        validarMaximoYDuplicado(votacion, vp, request.anonTokenHash());

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

        VotoMO voto = new VotoMO();
        voto.setVotacionProyecto(vp);
        voto.setAnonTokenHash(request.anonTokenHash());
        voto.setPuntuacionTotal(total);
        voto.setUsuario(usuario);
        VotoMO guardado = votoService.save(voto);

        for (CriterioEvaluacionMO c : criterios) {
            VotoCriterioMO vc = new VotoCriterioMO();
            vc.setVoto(guardado);
            vc.setCriterio(c);
            vc.setPuntuacion(puntuacionesMap.get(c.getId()));
            votoCriterioRepository.save(vc);

            PuntuacionCriterioMO pc = new PuntuacionCriterioMO();
            pc.setCriterio(c);
            pc.setVotacionProyecto(vp);
            pc.setAnonTokenHash(request.anonTokenHash());
            pc.setPuntuacion(puntuacionesMap.get(c.getId()));
            puntuacionCriterioRepository.save(pc);

            PuntuacionCriterioRequest pr = puntuacionesRequestMap.get(c.getId());
            if (votacion.isComentariosActivos() && pr != null && pr.comentario() != null && !pr.comentario().isBlank()) {
                ComentarioMO com = new ComentarioMO();
                com.setAnonTokenHash(request.anonTokenHash());
                com.setVotacionProyecto(vp);
                com.setProyecto(vp.getProyecto());
                com.setCriterio(c);
                com.setTexto(pr.comentario().trim());
                comentarioRepository.save(com);
            }
        }

        guardarComentarioGlobal(vp, request.anonTokenHash(), request.comentario());

        return guardado;
    }

    public boolean haAlcanzadoMaximo(UUID votacionId, String anonTokenHash) {
        if (anonTokenHash == null || anonTokenHash.isBlank()) return false;

        VotacionProyectoMO cualquier = votacionProyectoRepository.findByVotacion_Id(votacionId).stream()
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la votación."));

        long emitidos = votoService.contarVotosEmitidosEnVotacion(votacionId, anonTokenHash);
        return emitidos >= cualquier.getVotacion().getMaxSelecciones();
    }

    private void validarRequestBase(UUID votacionProyectoId, String anonTokenHash) {
        if (votacionProyectoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La opción de votación es obligatoria.");
        }
        if (anonTokenHash == null || anonTokenHash.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token del votante es obligatorio.");
        }
    }

    private VotacionProyectoMO obtenerVotacionProyecto(UUID id) {
        return votacionProyectoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la opción de votación."));
    }

    private void exigirModalidad(VotacionMO votacion, ModalidadVotacionMO esperada) {
        if (votacion.getModalidad() != esperada) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La votación no es de tipo " + esperada.name().toLowerCase() + ".");
        }
    }

    private void validarEstadoYFechas(VotacionMO votacion) {
        EstadoVotacionMO actual = votacion.getEstadoActual();
        switch (actual) {
            case PENDIENTE -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación todavía no ha comenzado.");
            case PAUSADA   -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación está pausada.");
            case CERRADA   -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación ya ha finalizado.");
            default -> { /* ABIERTA: ok */ }
        }
    }

    private void validarMaximoYDuplicado(VotacionMO votacion, VotacionProyectoMO vp, String anonTokenHash) {
        long emitidos = votoService.contarVotosEmitidosEnVotacion(votacion.getId(), anonTokenHash);
        if (emitidos >= votacion.getMaxSelecciones()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ya has alcanzado el número máximo de votos permitidos en esta votación.");
        }
        if (votoService.yaHaVotado(vp.getId(), anonTokenHash)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya habías votado este proyecto.");
        }
    }

    private void validarAutoVotacion(VotacionMO votacion, VotacionProyectoMO vp, UUID usuarioId) {
        if (votacion.getEvento() == null || votacion.getEvento().isAutoVotacion()) return;
        if (usuarioId == null) return;

        Optional<CompetidorMO> competidorOpt = competidorRepository.findByUsuarioId(usuarioId);
        if (competidorOpt.isEmpty()) return;

        EquipoMO equipo = equipoRepository.findByProyecto_Id(vp.getProyecto().getId());
        if (equipo == null) return;

        boolean esMiembro = competidorEventoRepository
            .existsByCompetidor_IdAndEquipo_Id(competidorOpt.get().getId(), equipo.getId());
        if (esMiembro) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes votar a tu propio proyecto en este evento.");
        }
    }

    private UsuarioMO validarJuradoSiHaceFalta(VotacionMO votacion, UUID usuarioId) {
        if (votacion.getTipo() != TipoVotacionMO.JURADO) return null;
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta votación requiere un usuario jurado.");
        }
        UsuarioMO usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario no encontrado."));
        if (usuario.getRol() != RolMO.JURADO && usuario.getRol() != RolMO.ORGANIZADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el jurado puede votar en esta votación.");
        }
        return usuario;
    }

    private void guardarComentarioGlobal(VotacionProyectoMO vp, String anonTokenHash, String texto) {
        if (!vp.getVotacion().isComentariosActivos()) return;
        if (texto == null || texto.isBlank()) return;
        ComentarioMO comentario = new ComentarioMO();
        comentario.setAnonTokenHash(anonTokenHash);
        comentario.setVotacionProyecto(vp);
        comentario.setProyecto(vp.getProyecto());
        comentario.setTexto(texto.trim());
        comentarioRepository.save(comentario);
    }

    private void validarComentarios(VotacionMO votacion, String comentario){
        if(!votacion.isComentariosActivos()){
            if(comentario != null && !comentario.isBlank()){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta votación no permite comentarios");
            }
        }
        if(votacion.isComentarioObligatorio()){
            if(comentario == null || comentario.isBlank()){
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comentario es obligatorio para esta votación");
            }
        }
    }
}