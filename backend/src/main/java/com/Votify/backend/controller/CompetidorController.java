package com.Votify.backend.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.service.CompetidorService;
import com.Votify.backend.service.GenericService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/competidores")
@RequiredArgsConstructor
public class CompetidorController extends GenericController<CompetidorMO> {

    private final CompetidorService competidorService;

    @Override
    protected GenericService<CompetidorMO> getService() {
        return competidorService;
    }

    @PostMapping
    public CompetidorMO create(@RequestBody CompetidorMO competidor) {
        return competidorService.crear(competidor);
    }

    @PutMapping("/{id}")
    public CompetidorMO update(@PathVariable UUID id, @RequestBody CompetidorMO competidor) {
        return competidorService.actualizar(id, competidor);
    }

    @PostMapping("/vincular-usuarios-existentes")
    public int vincularUsuariosExistentes() {
        return competidorService.vincularCompetidoresConUsuariosPorEmail();
    }
}