package com.Votify.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.service.EquipoService;
import com.Votify.backend.service.GenericService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoController extends GenericController<EquipoMO> {

    private final EquipoService equipoService;

    @Override
    protected GenericService<EquipoMO> getService() {
        return equipoService;
    }

    @PostMapping("/crear")
    public EquipoMO crear(@RequestBody EquipoMO equipo) {
        return equipoService.crear(equipo);
    }

    @GetMapping("/evento/{eventoId}")
    public List<EquipoMO> getEquiposByEvento(@PathVariable UUID eventoId) {
        return equipoService.getEquiposPorEvento(eventoId);
    }
}