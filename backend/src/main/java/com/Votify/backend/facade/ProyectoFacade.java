package com.Votify.backend.facade;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;
import com.Votify.backend.service.ProyectoService;
import com.Votify.backend.service.RankingService;

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
    private final RankingService rankingService;
    private final ProyectoRepository proyectoRepository;
    private final PuntuacionCriterioRepository puntuacionCriterioRepository;
    private final VotoCriterioRepository votoCriterioRepository;

    

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

        proyecto.setEquipo(equipo);
        proyecto = proyectoService.save(proyecto);

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
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "No se ha encontrado un competidor asociado a este usuario."
        ));

    List<CompetidorEventoMO> asignaciones = competidorEventoRepository.findByCompetidorId(competidor.getId());

    Set<UUID> equipoIds = new HashSet<>();

    for (CompetidorEventoMO asignacion : asignaciones) {
        if (asignacion.getEquipo() != null) {
            equipoIds.add(asignacion.getEquipo().getId());
        }
    }

    List<EquipoMO> equipos = equipoIds.isEmpty()
        ? Collections.emptyList()
        : equipoRepository.findAllById(equipoIds);

    List<EventoMO> eventos = eventoRepository.findAll();

    List<ProyectoMO> proyectos = new ArrayList<>();

    for (EquipoMO equipo : equipos) {
        proyectos.addAll(proyectoRepository.findByEquipo_Id(equipo.getId()));

        if (equipo.getProyecto() != null && proyectos.stream().noneMatch(p -> p.getId().equals(equipo.getProyecto().getId()))) {
            proyectos.add(equipo.getProyecto());
        }
    }

    List<MiProyectoDashboardResponse.ProyectoDashboardItem> proyectosDashboard = new ArrayList<>();

    for (ProyectoMO proyecto : proyectos) {
        EquipoMO equipo = proyecto.getEquipo();

        if (equipo == null) {
            equipo = equipos.stream()
                .filter(e -> e.getProyecto() != null && e.getProyecto().getId().equals(proyecto.getId()))
                .findFirst()
                .orElse(null);
        }

        EventoMO evento = proyecto.getEvento();
        List<ComentarioMO> comentarios = comentarioRepository.findByProyecto_Id(proyecto.getId());
        List<VotacionProyectoMO> relaciones = votacionProyectoRepository.findByProyecto_Id(proyecto.getId());

        long totalVotosProyecto = 0;
        List<MiProyectoDashboardResponse.VotacionDashboardItem> votacionesDashboard = new ArrayList<>();

        for (VotacionProyectoMO relacion : relaciones) {
            long votos = votoRepository.countByVotacionProyecto_Id(relacion.getId());
            totalVotosProyecto += votos;

            Map<String, Object> rankingEntry = null;
            List<Map<String, Object>> ranking = Collections.emptyList();


            if (relacion.getVotacion().getEvento() != null) {
                ranking = rankingService.calcularRanking(
                    relacion.getVotacion().getEvento().getId(),
                    relacion.getVotacion().getId()
                );

                rankingEntry = ranking.stream()
                    .filter(entry -> proyecto.getId().equals(entry.get("proyectoId")))
                    .findFirst()
                    .orElse(null);
            }

            votacionesDashboard.add(new MiProyectoDashboardResponse.VotacionDashboardItem(
                relacion.getId(),
                relacion.getVotacion(),
                votos,
                rankingEntry,
                ranking
            ));
        }

        proyectosDashboard.add(new MiProyectoDashboardResponse.ProyectoDashboardItem(
            proyecto,
            equipo,
            evento,
            totalVotosProyecto,
            relaciones.size(),
            0,
            comentarios != null ? comentarios : Collections.emptyList(),
            votacionesDashboard
        ));
    }

    return new MiProyectoDashboardResponse(
        usuarioId,
        competidor.getId(),
        equipos,
        eventos,
        proyectos,
        proyectosDashboard
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

    @Transactional
    public void delete(UUID id) {
        ProyectoMO proyecto = proyectoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado."));

        for (VotacionProyectoMO votacionProyecto : votacionProyectoRepository.findByProyecto_Id(id)) {
            comentarioRepository.deleteAll(comentarioRepository.findByVotacionProyecto_Id(votacionProyecto.getId()));
            puntuacionCriterioRepository.deleteAll(puntuacionCriterioRepository.findByVotacionProyecto_Id(votacionProyecto.getId()));

            for (VotoMO voto : votoRepository.findByVotacionProyecto_Id(votacionProyecto.getId())) {
                votoCriterioRepository.deleteAll(votoCriterioRepository.findByVoto_Id(voto.getId()));
                votoRepository.delete(voto);
            }
            votacionProyectoRepository.delete(votacionProyecto);
        }

        comentarioRepository.deleteAll(comentarioRepository.findByProyecto_Id(id));

        EquipoMO equipo = equipoRepository.findByProyecto_Id(id); 
        if (equipo != null) {
            equipo.setProyecto(null);
            equipoRepository.save(equipo);
        }
        proyecto.setEvento(null);
        proyecto.setEquipo(null);

        proyectoService.delete(proyecto.getId());
    }

    public java.util.List<ProyectoMO> findAll() {

        return proyectoService.findAll();

    }

    public ProyectoMO findById(UUID id) {

        return proyectoService.findById(id);

    }

    public java.util.List<ProyectoMO> findByEvento_Id(UUID eventoId) {

        return proyectoService.findByEvento_Id(eventoId);
        
    }
}