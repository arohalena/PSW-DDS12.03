package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.CrearProyectoRequest;
import com.Votify.backend.dto.MiProyectoDashboardResponse;
import com.Votify.backend.dto.ProyectoGestionRequest;
import com.Votify.backend.facade.ProyectoFacade;
import com.Votify.backend.model.ProyectoMO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/proyectos")
@RequiredArgsConstructor
public class ProyectoController {

    private final ProyectoFacade proyectoFacade;

    @GetMapping
    public List<ProyectoMO> getAll() {
        return proyectoFacade.findAll();
    }

    @GetMapping("/{id}")
    public ProyectoMO getById(@PathVariable UUID id) {
        return proyectoFacade.findById(id);
    }

    @GetMapping("/evento/{eventoId}")
    public List<ProyectoMO> getByEvento_Id(@PathVariable UUID eventoId) {
        return proyectoFacade.findByEvento_Id(eventoId);
    }

    @PostMapping("/crear")
    public ProyectoMO crear(@RequestBody ProyectoMO proyecto) {
        return proyectoFacade.crearSimple(proyecto);
    }

    @PostMapping("/crear-con-equipo")
    public ProyectoMO crearConEquipo(@RequestBody CrearProyectoRequest req) {
        return proyectoFacade.crearConEquipo(req);
    }

    @GetMapping("/usuario/{usuarioId}/dashboard")
    public MiProyectoDashboardResponse getMiProyectoDashboard(@PathVariable UUID usuarioId) {
        return proyectoFacade.getMiProyectoDashboard(usuarioId);
    }

    @PostMapping("/gestion")
    public ProyectoMO crearGestionado(@RequestBody ProyectoGestionRequest request) {
        return proyectoFacade.crearGestionado(request);
    }

    @PutMapping("/{id}/gestion")
    public ProyectoMO actualizarGestionado(@PathVariable UUID id, @RequestBody ProyectoGestionRequest request) {
        return proyectoFacade.actualizarGestionado(id, request);
    }

    @PostMapping("/{proyectoId}/evento/{eventoId}")
    public ProyectoMO meterEnEvento(@PathVariable UUID proyectoId, @PathVariable UUID eventoId) {
        return proyectoFacade.meterEnEvento(proyectoId, eventoId);
    }

    @DeleteMapping("/{proyectoId}/evento")
    public ProyectoMO quitarDeEvento(@PathVariable UUID proyectoId) {
        return proyectoFacade.quitarDeEvento(proyectoId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        proyectoFacade.delete(id);
    }
}