package com.Votify.backend.facade;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.domain.Proyecto;
import com.Votify.backend.dto.CrearProyectoRequest;
import com.Votify.backend.dto.MiProyectoDashboardResponse;
import com.Votify.backend.dto.ProyectoGestionRequest;
import com.Votify.backend.factory.CreadorProyecto;
import com.Votify.backend.factory.CreadorProyectoIA;
import com.Votify.backend.factory.CreadorProyectoSostenibilidad;
import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.CompetidorEventoMO;
import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoRepository;
import com.Votify.backend.service.ProyectoService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ProyectoFacade {

    private final ProyectoService proyectoService;

    private final EventoRepository eventoRepository;
    private final EquipoRepository equipoRepository;
    private final CompetidorRepository competidorRepository;
    private final CompetidorEventoRepository competidorEventoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ComentarioRepository comentarioRepository;
    private final VotacionRepository votacionRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoRepository votoRepository;

    public ProyectoMO crearSimple(ProyectoMO proyecto) {
        if (proyecto.getTipoCategoria() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se reconoce el tipo de proyecto deseado.");
        }

        CreadorProyecto creador = elegirCreador(proyecto.getTipoCategoria().name());
        Proyecto dominio = creador.create(proyecto.getNombre(), proyecto.getDescripcion());

        EventoMO evento = eventoRepository.findById(proyecto.getEvento().getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado."));

        ProyectoMO entidad = new ProyectoMO();
        entidad.setNombre(dominio.getNombre());
        entidad.setDescripcion(dominio.getDescripcion());
        entidad.setTipoCategoria(dominio.categoria());
        entidad.setEvento(evento);

        return proyectoService.save(entidad);
    }

    @Transactional
    public ProyectoMO crearConEquipo(CrearProyectoRequest request) {
        EventoMO evento = eventoRepository.findById(request.eventoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado."));

        if (request.tipoCategoria() == null || request.tipoCategoria().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria.");
        }

        CreadorProyecto creador = elegirCreador(request.tipoCategoria());
        Proyecto dominio = creador.create(request.nombre(), request.descripcion());

        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setNombre(dominio.getNombre());
        proyecto.setDescripcion(dominio.getDescripcion());
        proyecto.setTipoCategoria(dominio.categoria());
        proyecto.setEvento(evento);
        proyecto = proyectoService.save(proyecto);

        EquipoMO equipo = new EquipoMO();
        equipo.setNombre(request.nombreEquipo());
        equipo.setProyecto(proyecto);
        equipo.setEvento(evento);
        equipo = equipoRepository.save(equipo);

        if (request.miembrosEmails() != null) {
            for (String email : request.miembrosEmails()) {
                vincularMiembro(email, evento, equipo);
            }
        }

        return proyecto;
    }

    @Transactional
    public ProyectoMO crearGestionado(ProyectoGestionRequest request) {
        validarBase(request);

        EquipoMO equipo = equipoRepository.findById(request.equipoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado."));

        EventoMO evento = null;
        if (request.eventoId() != null) {
            evento = eventoRepository.findById(request.eventoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado."));

            validarEquipoDisponibleEnEvento(equipo.getId(), evento.getId(), null);
            validarVotacionesObligatoriasYDelEvento(request.votacionIds(), evento.getId());
        }

        ProyectoMO proyecto = proyectoService.guardarConDatos(
            new ProyectoMO(),
            request.nombre(), request.descripcion(), request.tipoCategoria(),
            equipo, evento
        );

        if (evento != null) {
            asignarAVotaciones(proyecto, request.votacionIds());
        }

        return proyecto;
    }

    @Transactional
    public ProyectoMO actualizarGestionado(UUID id, ProyectoGestionRequest request) {
        validarBase(request);

        ProyectoMO proyecto = proyectoService.obtener(id);
        EquipoMO equipo = equipoRepository.findById(request.equipoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado."));

        EventoMO evento = proyecto.getEvento();
        validarEquipoDisponibleEnEvento(equipo.getId(), evento != null ? evento.getId() : null, proyecto.getId());

        return proyectoService.guardarConDatos(
            proyecto,
            request.nombre(), request.descripcion(), request.tipoCategoria(),
            equipo, evento
        );
    }

    @Transactional
    public ProyectoMO meterEnEvento(UUID proyectoId, UUID eventoId) {
        ProyectoMO proyecto = proyectoService.obtener(proyectoId);

        if (proyecto.getEquipo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proyecto debe tener equipo asignado.");
        }

        EventoMO evento = eventoRepository.findById(eventoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado."));

        validarEquipoDisponibleEnEvento(proyecto.getEquipo().getId(), evento.getId(), proyecto.getId());

        proyecto.setEvento(evento);
        return proyectoService.save(proyecto);
    }

    @Transactional
    public ProyectoMO quitarDeEvento(UUID proyectoId) {
        ProyectoMO proyecto = proyectoService.obtener(proyectoId);

        votacionProyectoRepository.findByProyecto_Id(proyectoId)
            .forEach(votacionProyectoRepository::delete);

        proyecto.setEvento(null);
        return proyectoService.save(proyecto);
    }

    public MiProyectoDashboardResponse getMiProyectoDashboard(UUID usuarioId) {
        CompetidorMO competidor = competidorRepository.findByUsuarioId(usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "No se ha encontrado un competidor asociado a este usuario."));

        List<CompetidorEventoMO> asignaciones = competidorEventoRepository.findByCompetidorId(competidor.getId());
        if (asignaciones == null || asignaciones.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El competidor no está asignado a ningún equipo.");
        }

        CompetidorEventoMO asignacion = asignaciones.get(0);
        EquipoMO equipo = asignacion.getEquipo();

        if (equipo == null || equipo.getProyecto() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "No se ha encontrado un proyecto asociado al equipo del competidor.");
        }

        ProyectoMO proyecto = equipo.getProyecto();
        EventoMO evento = equipo.getEvento();

        List<ComentarioMO> comentarios = comentarioRepository.findByProyecto_Id(proyecto.getId());
        List<VotacionProyectoMO> votacionesProyecto = votacionProyectoRepository.findByProyecto_Id(proyecto.getId());

        long totalVotos = 0;
        for (VotacionProyectoMO vp : votacionesProyecto) {
            totalVotos += votoRepository.countByVotacionProyecto_Id(vp.getId());
        }

        return new MiProyectoDashboardResponse(
            usuarioId,
            competidor.getId(),
            proyecto,
            equipo,
            evento,
            totalVotos,
            comentarios != null ? comentarios : Collections.emptyList()
        );
    }

    private CreadorProyecto elegirCreador(String tipoCategoria) {
        return switch (tipoCategoria) {
            case "IA" -> new CreadorProyectoIA();
            case "SOSTENIBILIDAD" -> new CreadorProyectoSostenibilidad();
            default -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "No se reconoce la categoría: " + tipoCategoria);
        };
    }

    private void vincularMiembro(String email, EventoMO evento, EquipoMO equipo) {
        String emailLimpio = email.trim().toLowerCase();
        if (emailLimpio.isEmpty()) return;

        CompetidorMO competidor = competidorRepository.findByEmailIgnoreCase(emailLimpio)
            .orElseGet(() -> {
                CompetidorMO nuevo = new CompetidorMO();
                nuevo.setNombre(emailLimpio.split("@")[0]);
                nuevo.setEmail(emailLimpio);
                nuevo.setPassword(UUID.randomUUID().toString());
                usuarioRepository.findByEmail(emailLimpio).ifPresent(nuevo::setUsuario);
                return competidorRepository.save(nuevo);
            });

        if (competidor.getUsuario() == null) {
            usuarioRepository.findByEmail(emailLimpio)
                .ifPresent(u -> {
                    competidor.setUsuario(u);
                    competidorRepository.save(competidor);
                });
        }

        if (!competidorEventoRepository.existsByCompetidorIdAndEventoId(competidor.getId(), evento.getId())) {
            CompetidorEventoMO asignacion = new CompetidorEventoMO();
            asignacion.setCompetidor(competidor);
            asignacion.setEvento(evento);
            asignacion.setEquipo(equipo);
            competidorEventoRepository.save(asignacion);
        }
    }

    private void validarBase(ProyectoGestionRequest request) {
        if (request.nombre() == null || request.nombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del proyecto es obligatorio.");
        }
        if (request.tipoCategoria() == null || request.tipoCategoria().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria.");
        }
        if (request.equipoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El equipo es obligatorio.");
        }
    }

    private void validarEquipoDisponibleEnEvento(UUID equipoId, UUID eventoId, UUID proyectoActualId) {
        if (proyectoService.equipoOcupadoEnEvento(equipoId, eventoId, proyectoActualId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Este equipo ya tiene otro proyecto asignado a este evento.");
        }
    }

    private void validarVotacionesObligatoriasYDelEvento(List<UUID> votacionIds, UUID eventoId) {
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

    private void asignarAVotaciones(ProyectoMO proyecto, List<UUID> votacionIds) {
        for (UUID votacionId : votacionIds) {
            if (votacionProyectoRepository.existsByVotacion_IdAndProyecto_Id(votacionId, proyecto.getId())) continue;

            VotacionMO votacion = votacionRepository.findById(votacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Votación no encontrada."));

            VotacionProyectoMO relacion = new VotacionProyectoMO();
            relacion.setProyecto(proyecto);
            relacion.setVotacion(votacion);
            votacionProyectoRepository.save(relacion);
        }
    }
}