package com.Votify.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping
    public EquipoMO create(@RequestBody EquipoMO equipo) {
        return equipoService.crear(equipo);
    }
}