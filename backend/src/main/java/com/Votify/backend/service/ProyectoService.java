package com.Votify.backend.service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.domain.Proyecto;
import com.Votify.backend.dto.CrearProyectoRequest;
import com.Votify.backend.dto.MiProyectoDashboardResponse;
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
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProyectoService extends GenericService<ProyectoMO> {
    
    private final ProyectoRepository proyectoRepository;
    private final EventoRepository eventoRepository;
    private final EquipoRepository equipoRepository;
    private final CompetidorRepository competidorRepository;
    private final CompetidorEventoRepository competidorEventoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ComentarioRepository comentarioRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoRepository votoRepository;

    @Override
    protected JpaRepository<ProyectoMO, UUID> getRepository(){

        return proyectoRepository;

    }

    public List<ProyectoMO> findByEvento_Id(UUID eventoId){

        return proyectoRepository.findByEvento_Id(eventoId);

    }

    //Método fábrica para proyecto
    public ProyectoMO crear(ProyectoMO proyecto){

        if (proyecto.getTipoCategoria() == null) {
            throw new RuntimeException("No se reconoce el tipo de proyecto deseado.");
        }

        CreadorProyecto creador = switch (proyecto.getTipoCategoria().name()) {
            case "IA" -> new CreadorProyectoIA();
            case "SOSTENIBILIDAD" -> new CreadorProyectoSostenibilidad();
            default -> throw new RuntimeException("No se reconoce el tipo de proyecto deseado.");
        };

        Proyecto proyectoDominio = creador.create(proyecto.getNombre(), proyecto.getDescripcion());

        EventoMO evento = eventoRepository.findById(proyecto.getEvento().getId())
            .orElseThrow(() -> new RuntimeException("EventoMO no encontrado."));

        ProyectoMO entidad = new ProyectoMO();

        entidad.setNombre(proyectoDominio.getNombre());
        entidad.setDescripcion(proyectoDominio.getDescripcion());
        entidad.setTipoCategoria(proyectoDominio.categoria());
        entidad.setEvento(evento);

        return proyectoRepository.save(entidad);
        
    }

    public ProyectoMO crearConEquipo(CrearProyectoRequest request) {

        EventoMO evento = eventoRepository.findById(request.eventoId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Evento no encontrado."
            ));

        if (request.tipoCategoria() == null || request.tipoCategoria().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria.");
        }

        CreadorProyecto creador = switch (request.tipoCategoria()) {
            case "IA" -> new CreadorProyectoIA();
            case "SOSTENIBILIDAD" -> new CreadorProyectoSostenibilidad();
            default -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "No se reconoce la categoría: " + request.tipoCategoria()
            );
        };

        Proyecto proyectoDominio = creador.create(request.nombre(), request.descripcion());

        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setNombre(proyectoDominio.getNombre());
        proyecto.setDescripcion(proyectoDominio.getDescripcion());
        proyecto.setTipoCategoria(proyectoDominio.categoria());
        proyecto.setEvento(evento);
        proyecto = proyectoRepository.save(proyecto);

        EquipoMO equipo = new EquipoMO();
        equipo.setNombre(request.nombreEquipo());
        equipo.setProyecto(proyecto);
        equipo.setEvento(evento);
        equipo = equipoRepository.save(equipo);

        List<String> emails = request.miembrosEmails();
        if (emails != null) {
            for (String email : emails) {
                String emailLimpio = email.trim().toLowerCase();
                if (emailLimpio.isEmpty()) continue;

                CompetidorMO competidor = competidorRepository.findByEmailIgnoreCase(emailLimpio)
                    .orElseGet(() -> {
                        CompetidorMO nuevo = new CompetidorMO();
                        nuevo.setNombre(emailLimpio.split("@")[0]);
                        nuevo.setEmail(emailLimpio);
                        nuevo.setPassword(UUID.randomUUID().toString());

                        usuarioRepository.findByEmail(emailLimpio)
                            .ifPresent(nuevo::setUsuario);

                        return competidorRepository.save(nuevo);
                    });

                if (competidor.getUsuario() == null) {
                    usuarioRepository.findByEmail(emailLimpio)
                        .ifPresent(u -> {
                            competidor.setUsuario(u);
                            competidorRepository.save(competidor);
                        });
                }


                if (!competidorEventoRepository.existsByCompetidorIdAndEventoId(
                        competidor.getId(), evento.getId())) {

                    CompetidorEventoMO asignacion = new CompetidorEventoMO();
                    asignacion.setCompetidor(competidor);
                    asignacion.setEvento(evento);
                    asignacion.setEquipo(equipo);
                    competidorEventoRepository.save(asignacion);
                }
            }
        }

        return proyecto;
    }
    public MiProyectoDashboardResponse getMiProyectoDashboard(UUID usuarioId) {
        CompetidorMO competidor = competidorRepository.findByUsuarioId(usuarioId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se ha encontrado un competidor asociado a este usuario."
            ));

        List<CompetidorEventoMO> asignaciones = competidorEventoRepository.findByCompetidorId(competidor.getId());

        if (asignaciones == null || asignaciones.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "El competidor no está asignado a ningún equipo."
            );
        }

        CompetidorEventoMO asignacion = asignaciones.get(0);
        EquipoMO equipo = asignacion.getEquipo();

        if (equipo == null || equipo.getProyecto() == null) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se ha encontrado un proyecto asociado al equipo del competidor."
            );
        }

        ProyectoMO proyecto = equipo.getProyecto();
        EventoMO evento = equipo.getEvento();

        List<ComentarioMO> comentarios = comentarioRepository.findByProyecto_Id(proyecto.getId());
        List<VotacionProyectoMO> votacionesProyecto = votacionProyectoRepository.findByProyecto_Id(proyecto.getId());

        long totalVotos = 0;
        for (VotacionProyectoMO votacionProyecto : votacionesProyecto) {
            totalVotos += votoRepository.countByVotacionProyecto_Id(votacionProyecto.getId());
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
}
