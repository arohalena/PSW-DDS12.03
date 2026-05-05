package com.Votify.backend.facade;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.domain.Evento;
import com.Votify.backend.factory.CreadorEvento;
import com.Votify.backend.factory.CreadorFeriaInovacion;
import com.Votify.backend.factory.CreadorHackathonEvento;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.EventoOrganizadorRepository;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;
import com.Votify.backend.service.EventoService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class EventoFacade {

    private final EventoService eventoService;

    private final ProyectoRepository proyectoRepository;
    private final EquipoRepository equipoRepository;
    private final CompetidorEventoRepository competidorEventoRepository;
    private final EventoOrganizadorRepository eventoOrganizadorRepository;
    private final VotacionRepository votacionRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoRepository votoRepository;
    private final VotoCriterioRepository votoCriterioRepository;
    private final PuntuacionCriterioRepository puntuacionCriterioRepository;
    private final ComentarioRepository comentarioRepository;
    private final CriterioEvaluacionRepository criterioEvaluacionRepository;

    public EventoMO crear(String tipo, String nombre, String descripcion, String codigoAccesoPublico,
                          OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin, boolean autoVotacion) {

        if (tipo == null || tipo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se reconoce el tipo de evento deseado.");
        }
        if (nombre == null || nombre.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del evento es obligatorio.");
        }
        if (descripcion == null || descripcion.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La descripción del evento es obligatoria.");
        }
        if (fecha_inicio == null || fecha_fin == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas de inicio y fin son obligatorias.");
        }
        if (fecha_fin.isBefore(fecha_inicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        String codigo = eventoService.normalizarOCrearCodigo(codigoAccesoPublico);

        CreadorEvento creador = switch (tipo.trim().toUpperCase(Locale.ROOT)) {
            case "HACKATHON" -> new CreadorHackathonEvento();
            case "FERIA_INOVACION" -> new CreadorFeriaInovacion();
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "No se reconoce el tipo de evento deseado.");
        };

        Evento eventoDominio = creador.create(nombre.trim(), descripcion.trim(), codigo,
            fecha_inicio, fecha_fin, autoVotacion);

        EventoMO entidad = new EventoMO();
        entidad.setNombre(eventoDominio.getNombre());
        entidad.setCodigoAccesoPublico(eventoDominio.getCodigoAccesoPublico());
        entidad.setDescripcion(eventoDominio.getDescripcion());
        entidad.setTipoEvento(eventoDominio.tipo());
        entidad.setFecha_inicio(eventoDominio.getFechaInicio());
        entidad.setFecha_fin(eventoDominio.getFechaFin());
        entidad.setAutoVotacion(eventoDominio.isAutoVotacion());

        return eventoService.save(entidad);
    }

    @Transactional
    public void eliminarConCascada(UUID id) {
        EventoMO evento = eventoService.obtener(id);

        for (VotacionMO votacion : votacionRepository.findByEvento_Id(id)) {
            for (VotacionProyectoMO vp : votacionProyectoRepository.findByVotacion_Id(votacion.getId())) {
                comentarioRepository.deleteAll(comentarioRepository.findByVotacionProyecto_Id(vp.getId()));
                puntuacionCriterioRepository.deleteAll(puntuacionCriterioRepository.findByVotacionProyecto_Id(vp.getId()));

                for (VotoMO voto : votoRepository.findByVotacionProyecto_Id(vp.getId())) {
                    votoCriterioRepository.deleteAll(votoCriterioRepository.findByVoto_Id(voto.getId()));
                    votoRepository.delete(voto);
                }

                votacionProyectoRepository.delete(vp);
            }
            votacionRepository.delete(votacion);
        }

        criterioEvaluacionRepository.deleteAll(criterioEvaluacionRepository.findByEvento_IdOrderByOrdenAsc(id));
        competidorEventoRepository.deleteAll(competidorEventoRepository.findByEvento_Id(id));
        eventoOrganizadorRepository.deleteAll(eventoOrganizadorRepository.findByEvento_Id(id));

        for (ProyectoMO proyecto : proyectoRepository.findByEvento_Id(id)) {
            proyecto.setEvento(null);
            proyectoRepository.save(proyecto);
        }

        for (EquipoMO equipo : equipoRepository.findByEventoId(id)) {
            equipo.setEvento(null);
            equipoRepository.save(equipo);
        }

        eventoService.delete(evento.getId());
    }

    public java.util.List<EventoMO> findAll() {

        return eventoService.findAll();
        
    }

    public EventoMO findById(UUID id) {

        return eventoService.findById(id);

    }

    public String generarCodigoAccesoPublico() {

        return eventoService.generarCodigoAccesoPublico();

    }

    public EventoMO buscarPorCodigo(String codigo) {

        return eventoService.buscarPorCodigo(codigo);

    }
}