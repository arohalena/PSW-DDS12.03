package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.CrearEventoRequest;
import com.Votify.backend.facade.EventoFacade;
import com.Votify.backend.model.EventoMO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
public class EventoController {

    private final EventoFacade eventoFacade;

    @GetMapping
    public List<EventoMO> getAll() {
        return eventoFacade.findAll();
    }

    @GetMapping("/{id}")
    public EventoMO getById(@PathVariable UUID id) {
        return eventoFacade.findById(id);
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
        return eventoFacade.generarCodigoAccesoPublico();
    }

    @GetMapping("/codigo/{codigo}")
    public EventoMO getByCodigo(@PathVariable String codigo) {
        return eventoFacade.buscarPorCodigo(codigo);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        eventoFacade.eliminarConCascada(id);
    }
}