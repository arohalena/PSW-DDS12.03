package com.Votify.backend.facade;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.domain.Proyecto;
import com.Votify.backend.dto.CrearProyectoRequest;
import com.Votify.backend.dto.MiProyectoDashboardResponse;
import com.Votify.backend.dto.ProyectoGestionRequest;
import com.Votify.backend.dto.ProyectoGestionViewDTO;
import com.Votify.backend.factory.CreadorProyecto;
import com.Votify.backend.factory.CreadorProyectoIA;
import com.Votify.backend.factory.CreadorProyectoSostenibilidad;
import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.CompetidorEventoMO;
import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.service.ComentarioService;
import com.Votify.backend.service.CompetidorEventoService;
import com.Votify.backend.service.CompetidorService;
import com.Votify.backend.service.EquipoService;
import com.Votify.backend.service.EventoService;
import com.Votify.backend.service.ProyectoService;
import com.Votify.backend.service.RankingService;
import com.Votify.backend.service.VotacionProyectoService;
import com.Votify.backend.service.VotacionService;
import com.Votify.backend.service.VotoService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ProyectoFacade {

    private final ProyectoService proyectoService;
    private final EventoService eventoService;
    private final EquipoService equipoService;
    private final CompetidorService competidorService;
    private final CompetidorEventoService competidorEventoService;
    private final VotacionService votacionService;
    private final VotacionProyectoService votacionProyectoService;
    private final VotoService votoService;
    private final ComentarioService comentarioService;
    private final RankingService rankingService;

    public ProyectoMO crearSimple(ProyectoMO proyecto) {
        proyectoService.validarTipoCategoria(proyecto.getTipoCategoria());

        CreadorProyecto creador = elegirCreador(proyecto.getTipoCategoria().name());
        Proyecto dominio = creador.create(proyecto.getNombre(), proyecto.getDescripcion());

        EventoMO evento = eventoService.obtener(proyecto.getEvento().getId());

        return proyectoService.crearDesdeDominio(dominio, evento);
    }

    @Transactional
    public ProyectoMO crearConEquipo(CrearProyectoRequest request) {
        EventoMO evento = eventoService.obtener(request.eventoId());

        proyectoService.validarCategoriaTexto(request.tipoCategoria());
        competidorEventoService.validarMiembrosDisponiblesEnEvento(request.miembrosEmails(), evento);

        CreadorProyecto creador = elegirCreador(request.tipoCategoria());
        Proyecto dominio = creador.create(request.nombre(), request.descripcion());

        ProyectoMO proyecto = proyectoService.crearDesdeDominio(dominio, evento);

        EquipoMO equipo = new EquipoMO();
        equipo.setNombre(request.nombreEquipo());
        equipo.setProyecto(proyecto);
        equipo.setEvento(evento);
        equipo = equipoService.save(equipo);

        proyecto.setEquipo(equipo);
        proyecto = proyectoService.save(proyecto);

        if (request.miembrosEmails() != null) {
            for (String email : request.miembrosEmails()) {
                competidorEventoService.vincularMiembroPorEmail(email, evento, equipo);
            }
        }

        return proyecto;
    }

    @Transactional
    public ProyectoMO crearGestionado(ProyectoGestionRequest request) {
        proyectoService.validarDatosGestion(request);

        EquipoMO equipo = equipoService.obtener(request.equipoId());

        EventoMO evento = null;
        if (request.eventoId() != null) {
            evento = eventoService.obtener(request.eventoId());
            proyectoService.validarEquipoDisponibleEnEvento(equipo.getId(), evento.getId(), null);
            votacionService.validarVotacionesDelEvento(request.votacionIds(), evento.getId());
        }

        ProyectoMO proyecto = proyectoService.guardarConDatos(
            new ProyectoMO(),
            request.nombre(), request.descripcion(), request.tipoCategoria(),
            equipo, evento
        );

        if (evento != null) {
            votacionProyectoService.asignarProyectoAVotaciones(proyecto, request.votacionIds());
        }

        return proyecto;
    }

    @Transactional
    public ProyectoMO actualizarGestionado(UUID id, ProyectoGestionRequest request) {
        proyectoService.validarDatosGestion(request);

        ProyectoMO proyecto = proyectoService.obtener(id);
        EquipoMO equipo = equipoService.obtener(request.equipoId());

        EventoMO evento = proyecto.getEvento();
        proyectoService.validarEquipoDisponibleEnEvento(
            equipo.getId(),
            evento != null ? evento.getId() : null,
            proyecto.getId()
        );

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

        EventoMO evento = eventoService.obtener(eventoId);
        proyectoService.validarEquipoDisponibleEnEvento(proyecto.getEquipo().getId(), evento.getId(), proyecto.getId());

        proyecto.setEvento(evento);
        return proyectoService.save(proyecto);
    }

    @Transactional
    public ProyectoMO quitarDeEvento(UUID proyectoId) {
        ProyectoMO proyecto = proyectoService.obtener(proyectoId);

        votacionProyectoService.desvincularDeProyecto(proyectoId);

        proyecto.setEvento(null);
        return proyectoService.save(proyecto);
    }

    public MiProyectoDashboardResponse getMiProyectoDashboard(UUID usuarioId) {
        CompetidorMO competidor = competidorService.obtenerPorUsuarioId(usuarioId);

        List<CompetidorEventoMO> asignaciones = competidorEventoService.getAsignacionesPorCompetidor(competidor.getId());

        Set<UUID> equipoIds = new HashSet<>();
        for (CompetidorEventoMO asignacion : asignaciones) {
            if (asignacion.getEquipo() != null) {
                equipoIds.add(asignacion.getEquipo().getId());
            }
        }

        List<EquipoMO> equipos = equipoIds.isEmpty()
            ? Collections.emptyList()
            : equipoService.findAllByIds(equipoIds);

        List<EventoMO> eventos = asignaciones.stream()
            .map(CompetidorEventoMO::getEvento)
            .filter(evento -> evento != null)
            .collect(Collectors.toMap(
                EventoMO::getId,
                evento -> evento,
                (primero, repetido) -> primero
            ))
            .values()
            .stream()
            .toList();

        List<ProyectoMO> proyectos = new ArrayList<>();

        for (EquipoMO equipo : equipos) {
            proyectos.addAll(proyectoService.findByEquipo_Id(equipo.getId()));

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
            List<ComentarioMO> comentarios = comentarioService.findByProyecto(proyecto.getId());
            List<VotacionProyectoMO> relaciones = votacionProyectoService.findByProyecto_Id(proyecto.getId());

            long totalVotosProyecto = 0;
            List<MiProyectoDashboardResponse.VotacionDashboardItem> votacionesDashboard = new ArrayList<>();

            for (VotacionProyectoMO relacion : relaciones) {
                long votos = votoService.contarVotosPorVotacionProyecto(relacion.getId());
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

    @Transactional
    public void delete(UUID id) {
        proyectoService.eliminarConCascada(id);
    }

    public List<ProyectoMO> findAll() {
        return proyectoService.findAll();
    }

    public ProyectoMO findById(UUID id) {
        return proyectoService.findById(id);
    }

    public List<ProyectoMO> findByEvento_Id(UUID eventoId) {
        return proyectoService.findByEvento_Id(eventoId);
    }

    private CreadorProyecto elegirCreador(String tipoCategoria) {
        return switch (tipoCategoria) {
            case "IA" -> new CreadorProyectoIA();
            case "SOSTENIBILIDAD" -> new CreadorProyectoSostenibilidad();
            default -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "No se reconoce la categoría: " + tipoCategoria);
        };
    }

    public List<ProyectoGestionViewDTO> getVistaGestion() {

        List<ProyectoMO> proyectos = proyectoService.findAllConRelaciones();

        List<UUID> ids = proyectos.stream().map(ProyectoMO::getId).toList();

        Map<UUID, List<VotacionProyectoMO>> relacionesPorProyecto =
            votacionProyectoService.findRelacionesByProyectoIds(ids).stream()
                .collect(Collectors.groupingBy(vp -> vp.getProyecto().getId()));

        return proyectos.stream()
            .map(p -> toViewDTO(p, relacionesPorProyecto.getOrDefault(p.getId(), List.of())))
            .toList();
    }

    private ProyectoGestionViewDTO toViewDTO(ProyectoMO p, List<VotacionProyectoMO> relaciones) {

        ProyectoGestionViewDTO.RefDTO equipoRef = p.getEquipo() == null
            ? null
            : new ProyectoGestionViewDTO.RefDTO(p.getEquipo().getId(), p.getEquipo().getNombre());

        ProyectoGestionViewDTO.RefDTO eventoRef = p.getEvento() == null
            ? null
            : new ProyectoGestionViewDTO.RefDTO(p.getEvento().getId(), p.getEvento().getNombre());

        List<ProyectoGestionViewDTO.VotacionRefDTO> votacionesRef = relaciones.stream()
            .map(vp -> new ProyectoGestionViewDTO.VotacionRefDTO(
                vp.getId(),
                vp.getVotacion().getId(),
                vp.getVotacion().getNombre(),
                vp.getVotacion().getTipo() != null ? vp.getVotacion().getTipo().name() : null,
                vp.getVotacion().getModalidad() != null ? vp.getVotacion().getModalidad().name() : null,
                votoService.contarVotosPorVotacionProyecto(vp.getId())
            ))
            .toList();

        long totalVotos = votacionesRef.stream()
            .mapToLong(ProyectoGestionViewDTO.VotacionRefDTO::getTotalVotos)
            .sum();

        return new ProyectoGestionViewDTO(
            p.getId(),
            p.getNombre(),
            p.getDescripcion(),
            p.getTipoCategoria(),
            equipoRef,
            eventoRef,
            totalVotos,
            votacionesRef
        );
    }
}
