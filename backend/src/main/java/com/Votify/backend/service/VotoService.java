package com.Votify.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
import com.Votify.backend.model.PuntuacionCriterioMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoCriterioMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;

import com.Votify.backend.dto.EmitirVotoPuntosRequest;
import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.UsuarioMO;


import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class VotoService extends GenericService<VotoMO> {

    private final VotoRepository votoRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final CriterioEvaluacionRepository criterioEvaluacionRepository;
    private final VotoCriterioRepository votoCriterioRepository;
    private final PuntuacionCriterioRepository puntuacionCriterioRepository;
    private final ComentarioRepository comentarioRepository;

    private final UsuarioRepository usuarioRepository;

    @Override
    protected JpaRepository<VotoMO, UUID> getRepository() {
        return votoRepository;
    }

    public List<VotoMO> findByVotacionProyecto_Id(UUID votacionProyectoId) {
        return votoRepository.findByVotacionProyecto_Id(votacionProyectoId);
    }

    @Transactional
    public VotoMO votarSimple(EmitirVotoSimpleRequest request) {
        if (request.votacionProyectoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La opción de votación es obligatoria.");
        }

        if (request.anonTokenHash() == null || request.anonTokenHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token del votante es obligatorio.");
        }

        if (request.comentario() == null || request.comentario().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comentario es obligatorio.");
        }

        VotacionProyectoMO votacionProyecto = votacionProyectoRepository.findById(request.votacionProyectoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la opción de votación."));

        VotacionMO votacion = votacionProyecto.getVotacion();

        if (votacion.getModalidad() != ModalidadVotacionMO.SIMPLE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no es simple.");
        }

        UsuarioMO usuario = validarJuradoSiHaceFalta(votacion, request.usuarioId());
        validarEstadoYFechas(votacion);
        validarMaximoYDuplicado(votacion, votacionProyecto, request.anonTokenHash());

        VotoMO voto = new VotoMO();
        voto.setVotacionProyecto(votacionProyecto);
        voto.setAnonTokenHash(request.anonTokenHash());
        voto.setUsuario(usuario);
        voto.setPuntuacionTotal(BigDecimal.ONE);

        VotoMO guardado = votoRepository.save(voto);

        ComentarioMO comentario = new ComentarioMO();
        comentario.setAnonTokenHash(request.anonTokenHash());
        comentario.setVotacionProyecto(votacionProyecto);
        comentario.setProyecto(votacionProyecto.getProyecto());
        comentario.setTexto(request.comentario().trim());
        comentarioRepository.save(comentario);

        return guardado;
    }

    @Transactional
    public VotoMO votarMulticriterio(EmitirEvaluacionRequest request) {
        if (request.votacionProyectoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La opción de votación es obligatoria.");
        }

        if (request.anonTokenHash() == null || request.anonTokenHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token del votante es obligatorio.");
        }

        if (request.comentario() == null || request.comentario().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comentario es obligatorio.");
        }

        VotacionProyectoMO votacionProyecto = votacionProyectoRepository.findById(request.votacionProyectoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la opción de votación."));

        VotacionMO votacion = votacionProyecto.getVotacion();

        if (votacion.getModalidad() != ModalidadVotacionMO.MULTICRITERIO &&
            votacion.getModalidad() != ModalidadVotacionMO.MULTICRITERIO_PONDERADA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no es multicriterio.");
        }

        UsuarioMO usuario = validarJuradoSiHaceFalta(votacion, request.usuarioId());
        validarEstadoYFechas(votacion);
        validarMaximoYDuplicado(votacion, votacionProyecto, request.anonTokenHash());

        List<CriterioEvaluacionMO> criterios = criterioEvaluacionRepository
            .findByEvento_IdOrderByOrdenAsc(votacion.getEvento().getId());

        if (criterios.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no tiene criterios configurados.");
        }

        if (request.puntuaciones() == null || request.puntuaciones().size() != criterios.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes puntuar todos los criterios.");
        }

        Map<UUID, CriterioEvaluacionMO> criteriosMap = criterios.stream()
            .collect(Collectors.toMap(CriterioEvaluacionMO::getId, Function.identity()));

        for (PuntuacionCriterioRequest puntuacionReq : request.puntuaciones()) {
            if (puntuacionReq.criterioId() == null || !criteriosMap.containsKey(puntuacionReq.criterioId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Se ha enviado un criterio no válido.");
            }

            if (puntuacionReq.puntuacion() == null || puntuacionReq.puntuacion() < 1 || puntuacionReq.puntuacion() > 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada criterio debe puntuarse entre 1 y 5.");
            }
        }

        Map<UUID, PuntuacionCriterioRequest> puntuacionesRequestMap = request.puntuaciones().stream()
            .collect(Collectors.toMap(
                PuntuacionCriterioRequest::criterioId,
                Function.identity(),
                (a, b) -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes repetir criterios.");
                }
            ));

        Map<UUID, Integer> puntuacionesMap = puntuacionesRequestMap.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> entry.getValue().puntuacion()
            ));

        BigDecimal total = BigDecimal.ZERO;

        for (CriterioEvaluacionMO criterio : criterios) {
            Integer puntuacion = puntuacionesMap.get(criterio.getId());

            BigDecimal parcial;

            if(votacion.getModalidad() == ModalidadVotacionMO.MULTICRITERIO_PONDERADA){
                parcial = BigDecimal.valueOf(puntuacion)
                    .multiply(BigDecimal.valueOf(criterio.getPeso()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else {
                parcial = BigDecimal.valueOf(puntuacion);
            }

            total = total.add(parcial);
        }

        if (votacion.getModalidad() == ModalidadVotacionMO.MULTICRITERIO){
            total = total.divide(BigDecimal.valueOf(criterios.size()), 2, RoundingMode.HALF_UP);  
        }
        

        VotoMO voto = new VotoMO();
        voto.setVotacionProyecto(votacionProyecto);
        voto.setAnonTokenHash(request.anonTokenHash());
        voto.setPuntuacionTotal(total);
        voto.setUsuario(usuario);
        VotoMO guardado = votoRepository.save(voto);

        for (CriterioEvaluacionMO criterio : criterios) {
            VotoCriterioMO votoCriterio = new VotoCriterioMO();
            votoCriterio.setVoto(guardado);
            votoCriterio.setCriterio(criterio);
            votoCriterio.setPuntuacion(puntuacionesMap.get(criterio.getId()));
            votoCriterioRepository.save(votoCriterio);

            PuntuacionCriterioMO puntuacionCriterio = new PuntuacionCriterioMO();
            puntuacionCriterio.setCriterio(criterio);
            puntuacionCriterio.setVotacionProyecto(votacionProyecto);
            puntuacionCriterio.setAnonTokenHash(request.anonTokenHash());
            puntuacionCriterio.setPuntuacion(puntuacionesMap.get(criterio.getId()));
            puntuacionCriterioRepository.save(puntuacionCriterio);

            PuntuacionCriterioRequest puntuacionReq = puntuacionesRequestMap.get(criterio.getId());

            if (puntuacionReq != null && puntuacionReq.comentario() != null && !puntuacionReq.comentario().isBlank()) {
                ComentarioMO comentarioCriterio = new ComentarioMO();
                comentarioCriterio.setAnonTokenHash(request.anonTokenHash());
                comentarioCriterio.setVotacionProyecto(votacionProyecto);
                comentarioCriterio.setProyecto(votacionProyecto.getProyecto());
                comentarioCriterio.setCriterio(criterio);
                comentarioCriterio.setTexto(puntuacionReq.comentario().trim());
                comentarioRepository.save(comentarioCriterio);
            }

            
        }

        ComentarioMO comentario = new ComentarioMO();
        comentario.setAnonTokenHash(request.anonTokenHash());
        comentario.setVotacionProyecto(votacionProyecto);
        comentario.setProyecto(votacionProyecto.getProyecto());
        comentario.setTexto(request.comentario().trim());
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
        
        EstadoVotacionMO actual = votacion.getEstadoActual();

        switch(actual){

            case PENDIENTE:

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La votación todavía no ha comenzado."

                );
            
            case PAUSADA:

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La votación está pausada."
                );
            
            case CERRADA:

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La votación ya ha finalizado."
                );
            
            case ABIERTA:
            default:
                break;

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

    public long contarVotantesUnicos(UUID eventoId) {

        return votoRepository.countDistinctVotantesByEventoId(eventoId);
    
    }

    @Transactional
    public VotoMO votarPuntos(EmitirVotoPuntosRequest request){
        if(request.votacionProyectoId() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La opción de votación es obligatoria");
        }

        if(request.anonTokenHash() == null || request.anonTokenHash().isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token del votante es obligatorio");
        }

        if (request.puntuacion() == null || request.puntuacion() < 1 || request.puntuacion() > 10) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La puntuación debe estar entre 1 y 10.");
        }

        VotacionProyectoMO votacionProyecto = votacionProyectoRepository.findById(request.votacionProyectoId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la opción de votación"));

        VotacionMO votacion = votacionProyecto.getVotacion();
        if (votacion.getModalidad() != ModalidadVotacionMO.PUNTOS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no es por puntos");
        }

        UsuarioMO usuario = validarJuradoSiHaceFalta(votacion, request.usuarioId());
        validarEstadoYFechas(votacion);
        validarMaximoYDuplicado(votacion, votacionProyecto, request.anonTokenHash());
        VotoMO voto = new VotoMO();
        voto.setVotacionProyecto(votacionProyecto);
        voto.setAnonTokenHash(request.anonTokenHash());
        voto.setUsuario(usuario);
        voto.setPuntuacionTotal(BigDecimal.valueOf(request.puntuacion()));

        VotoMO guardado = votoRepository.save(voto);

        if (request.comentario() != null && !request.comentario().isBlank()) {
        ComentarioMO comentario = new ComentarioMO();
        comentario.setAnonTokenHash(request.anonTokenHash());
        comentario.setVotacionProyecto(votacionProyecto);
        comentario.setProyecto(votacionProyecto.getProyecto());
        comentario.setTexto(request.comentario().trim());
        comentarioRepository.save(comentario);
        }

        return guardado;

    }

    private UsuarioMO validarJuradoSiHaceFalta(VotacionMO votacion, UUID usuarioId) {
    if (votacion.getTipo() != TipoVotacionMO.JURADO) {
        return null;
    }

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

}
