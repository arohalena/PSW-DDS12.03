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
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.service.CompetidorEventoService;
import com.Votify.backend.service.CriterioEvaluacionService;
import com.Votify.backend.service.EquipoService;
import com.Votify.backend.service.EventoOrganizadorService;
import com.Votify.backend.service.EventoService;
import com.Votify.backend.service.ProyectoService;
import com.Votify.backend.service.VotacionService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class EventoFacade {

    private final EventoService eventoService;
    private final VotacionService votacionService;
    private final CriterioEvaluacionService criterioEvaluacionService;
    private final CompetidorEventoService competidorEventoService;
    private final EventoOrganizadorService eventoOrganizadorService;
    private final ProyectoService proyectoService;
    private final EquipoService equipoService;

    public EventoMO crear(String tipo, String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin, boolean autoVotacion) {

        eventoService.validarDatosCreacion(tipo, nombre, descripcion, fecha_inicio, fecha_fin);

        String codigo = eventoService.normalizarOCrearCodigo(codigoAccesoPublico);

        CreadorEvento creador = switch (tipo.trim().toUpperCase(Locale.ROOT)) {
            case "HACKATHON" -> new CreadorHackathonEvento();
            case "FERIA_INOVACION" -> new CreadorFeriaInovacion();
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "No se reconoce el tipo de evento deseado.");
        };

        Evento eventoDominio = creador.create(nombre.trim(), descripcion.trim(), codigo,
            fecha_inicio, fecha_fin, autoVotacion);

        return eventoService.crearDesdeDominio(eventoDominio);
    }

    @Transactional
    public void eliminarConCascada(UUID id) {
        EventoMO evento = eventoService.obtener(id);

        votacionService.eliminarTodasDeEvento(id);
        criterioEvaluacionService.deleteAllByEventoId(id);
        competidorEventoService.eliminarTodasDeEvento(id);
        eventoOrganizadorService.eliminarTodasDeEvento(id);
        proyectoService.desvincularDeEvento(id);
        equipoService.desvincularDeEvento(id);

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