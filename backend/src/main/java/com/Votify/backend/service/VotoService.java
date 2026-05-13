package com.Votify.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class VotoService extends GenericService<VotoMO> {

    private final VotoRepository votoRepository;

    // Services usados para las validaciones que antes vivían en el Facade
    private final VotacionProyectoService votacionProyectoService;
    private final UsuarioService usuarioService;
    private final CompetidorService competidorService;
    private final EquipoService equipoService;
    private final CompetidorEventoService competidorEventoService;

    @Override
    protected JpaRepository<VotoMO, UUID> getRepository() {
        return votoRepository;
    }

    // ============ Consultas ============

    public List<VotoMO> findByVotacionProyecto_Id(UUID votacionProyectoId) {
        return votoRepository.findByVotacionProyecto_Id(votacionProyectoId);
    }

    public long contarVotosPorVotacionProyecto(UUID votacionProyectoId) {
        return votoRepository.countByVotacionProyecto_Id(votacionProyectoId);
    }

    public boolean yaHaVotado(UUID votacionProyectoId, String anonTokenHash) {
        if (anonTokenHash == null || anonTokenHash.isBlank()) return false;
        return votoRepository.existsByVotacionProyecto_IdAndAnonTokenHash(votacionProyectoId, anonTokenHash);
    }

    public long contarVotosEmitidosEnVotacion(UUID votacionId, String anonTokenHash) {
        return votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(votacionId, anonTokenHash);
    }

    public long contarVotantesUnicos(UUID eventoId) {
        return votoRepository.countDistinctVotantesByEventoId(eventoId);
    }

    // ============ Validaciones (antes privadas en VotoFacade) ============

    public void validarRequestBase(UUID votacionProyectoId, String anonTokenHash) {
        if (votacionProyectoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La opción de votación es obligatoria.");
        }
        if (anonTokenHash == null || anonTokenHash.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token del votante es obligatorio.");
        }
    }

    public VotacionProyectoMO obtenerVotacionProyecto(UUID id) {
        return votacionProyectoService.obtener(id);
    }

    public void exigirModalidad(VotacionMO votacion, ModalidadVotacionMO esperada) {
        if (votacion.getModalidad() != esperada) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La votación no es de tipo " + esperada.name().toLowerCase() + ".");
        }
    }

    public void exigirModalidadMulticriterio(VotacionMO votacion) {
        if (votacion.getModalidad() != ModalidadVotacionMO.MULTICRITERIO &&
            votacion.getModalidad() != ModalidadVotacionMO.MULTICRITERIO_PONDERADA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no es multicriterio.");
        }
    }

    public void validarEstadoYFechas(VotacionMO votacion) {
        EstadoVotacionMO actual = votacion.getEstadoActual();
        switch (actual) {
            case PENDIENTE -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación todavía no ha comenzado.");
            case PAUSADA   -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación está pausada.");
            case CERRADA   -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación ya ha finalizado.");
            default -> { /* ABIERTA: ok */ }
        }
    }

    public void validarMaximoYDuplicado(VotacionMO votacion, VotacionProyectoMO vp, String anonTokenHash) {
        long emitidos = contarVotosEmitidosEnVotacion(votacion.getId(), anonTokenHash);
        if (emitidos >= votacion.getMaxSelecciones()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ya has alcanzado el número máximo de votos permitidos en esta votación.");
        }
        if (yaHaVotado(vp.getId(), anonTokenHash)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya habías votado este proyecto.");
        }
    }

    public void validarAutoVotacion(VotacionMO votacion, VotacionProyectoMO vp, UUID usuarioId) {
        if (votacion.getEvento() == null || votacion.getEvento().isAutoVotacion()) return;
        if (usuarioId == null) return;

        Optional<CompetidorMO> competidorOpt = competidorService.findByUsuarioIdOpt(usuarioId);
        if (competidorOpt.isEmpty()) return;

        EquipoMO equipo = equipoService.findByProyectoId(vp.getProyecto().getId());
        if (equipo == null) return;

        boolean esMiembro = competidorEventoService.esMiembroDeEquipo(competidorOpt.get().getId(), equipo.getId());
        if (esMiembro) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes votar a tu propio proyecto en este evento.");
        }
    }

    public UsuarioMO validarJurado(VotacionMO votacion, UUID usuarioId) {
        TipoVotacionMO tipo = votacion.getTipo();

        // Votación POPULAR pura: nadie firma el voto, todos anónimos
        if (tipo == TipoVotacionMO.POPULAR) return null;

        // Votación JURADO pura: solo jurados u organizadores pueden votar y firman
        if (tipo == TipoVotacionMO.JURADO) {
            if (usuarioId == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta votación requiere un usuario jurado.");
            }

            UsuarioMO usuario = usuarioService.obtener(usuarioId);
            if (usuario.getRol() != RolMO.JURADO && usuario.getRol() != RolMO.ORGANIZADOR) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el jurado puede votar en esta votación.");
            }
            return usuario;
        }

        // Votación MIXTA: anonimato selectivo por rol
        if (tipo == TipoVotacionMO.MIXTA) {
            // Voto público sin sesión iniciada: anónimo
            if (usuarioId == null) return null;

            UsuarioMO usuario = usuarioService.obtener(usuarioId);

            // Solo jurados u organizadores firman el voto. El resto vota anónimo.
            if (usuario.getRol() == RolMO.JURADO || usuario.getRol() == RolMO.ORGANIZADOR) {
                return usuario;
            }
            return null;
        }

        return null;
    }

    public void validarComentarios(VotacionMO votacion, String comentario) {
        if (!votacion.isComentariosActivos()) {
            if (comentario != null && !comentario.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta votación no permite comentarios");
            }
        }
        if (votacion.isComentarioObligatorio()) {
            if (comentario == null || comentario.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comentario es obligatorio para esta votación");
            }
        }
    }

    public boolean haAlcanzadoMaximo(VotacionProyectoMO referencia, String anonTokenHash) {
        long emitidos = contarVotosEmitidosEnVotacion(referencia.getVotacion().getId(), anonTokenHash);
        return emitidos >= referencia.getVotacion().getMaxSelecciones();
    }
}