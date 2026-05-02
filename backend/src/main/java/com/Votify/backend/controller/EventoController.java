package com.Votify.backend.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.CrearEventoRequest;
import com.Votify.backend.facade.EventoFacade;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.service.EventoService;
import com.Votify.backend.service.GenericService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
public class EventoController extends GenericController<EventoMO> {

    private final EventoService eventoService;
    private final EventoFacade eventoFacade;

    @Override
    protected GenericService<EventoMO> getService() {
        return eventoService;
    }

    @PostMapping("/crear")
    public EventoMO crear(@RequestBody CrearEventoRequest body) {
        return eventoFacade.crear(
            body.tipo(),
            body.nombre(),
            body.descripcion(),
            body.codigoAccesoPublico(),
            body.fecha_inicio(),
            body.fecha_fin(),
            body.autoVotacion() != null && body.autoVotacion()
        );
    }

    @GetMapping("/generar-codigo")
    public String generarCodigo() {
        return eventoService.generarCodigoAccesoPublico();
    }

    @GetMapping("/codigo/{codigo}")
    public EventoMO getByCodigo(@PathVariable String codigo) {
        return eventoService.buscarPorCodigo(codigo);
    }

    @Override
    public void delete(@PathVariable UUID id) {
        eventoFacade.eliminarConCascada(id);
    }
}