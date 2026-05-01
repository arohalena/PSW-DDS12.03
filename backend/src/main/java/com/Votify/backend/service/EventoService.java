package com.Votify.backend.service;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
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
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventoService extends GenericService<EventoMO> {
    
    private final EventoRepository eventoRepository;
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

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    protected JpaRepository<EventoMO, UUID> getRepository(){

        return eventoRepository;

    }

    //Método para la creación de la factoría de evento
    public EventoMO crear(String tipo, String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin, boolean autoVotacion) {

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

        String codigo = normalizarOCrearCodigo(codigoAccesoPublico);
        
        CreadorEvento creador = switch (tipo.trim().toUpperCase(Locale.ROOT)) {
            case "HACKATHON" -> new CreadorHackathonEvento();
            case "FERIA_INOVACION" -> new CreadorFeriaInovacion();
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No se reconoce el tipo de evento deseado.");
        };

        Evento eventoDominio = creador.create(nombre.trim(), descripcion.trim(), codigo, fecha_inicio, fecha_fin, autoVotacion);

        EventoMO entidad = new EventoMO();
        
        entidad.setNombre(eventoDominio.getNombre());
        entidad.setCodigoAccesoPublico(eventoDominio.getCodigoAccesoPublico());
        entidad.setDescripcion(eventoDominio.getDescripcion());
        entidad.setTipoEvento(eventoDominio.tipo());
        entidad.setFecha_inicio(eventoDominio.getFechaInicio());
        entidad.setFecha_fin(eventoDominio.getFechaFin());
        entidad.setAutoVotacion(eventoDominio.isAutoVotacion());

        return eventoRepository.save(entidad);
    }

    public String generarCodigoAccesoPublico() {
        String code;
        do {
            code = randomCode();
        } while (eventoRepository.existsByCodigoAccesoPublico(code));

        return code;
    }

    public EventoMO buscarPorCodigo(String codigo) {
        return eventoRepository.findByCodigoAccesoPublico(normalizarCodigo(codigo))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se ha encontrado ningún evento con ese código."));
    }


    private String normalizarOCrearCodigo(String codigoAccesoPublico) {
        if (codigoAccesoPublico == null || codigoAccesoPublico.isBlank()) {
        return null;
        }

        String codigo = normalizarCodigo(codigoAccesoPublico);

        if (eventoRepository.existsByCodigoAccesoPublico(codigo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ya existe un evento con ese código de acceso.");
        }

        return codigo;
    }

    private String normalizarCodigo(String codigo) {
        return codigo == null ? "" : codigo.trim().toUpperCase(Locale.ROOT);
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = RANDOM.nextInt(ALPHABET.length());
            builder.append(ALPHABET.charAt(index));
        }
        return builder.toString();
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        EventoMO evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado."));

        for (VotacionMO votacion : votacionRepository.findByEvento_Id(id)) {
            for (VotacionProyectoMO votacionProyecto : votacionProyectoRepository.findByVotacion_Id(votacion.getId())) {
                comentarioRepository.deleteAll(comentarioRepository.findByVotacionProyecto_Id(votacionProyecto.getId()));
                puntuacionCriterioRepository.deleteAll(puntuacionCriterioRepository.findByVotacionProyecto_Id(votacionProyecto.getId()));

                for (VotoMO voto : votoRepository.findByVotacionProyecto_Id(votacionProyecto.getId())) {
                    votoCriterioRepository.deleteAll(votoCriterioRepository.findByVoto_Id(voto.getId()));
                    votoRepository.delete(voto);
                }

                votacionProyectoRepository.delete(votacionProyecto);
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

        eventoRepository.delete(evento);
    }



}