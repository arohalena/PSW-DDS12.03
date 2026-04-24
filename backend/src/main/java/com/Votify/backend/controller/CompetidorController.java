package com.Votify.backend.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
    public ResponseEntity<?> create(@RequestBody CompetidorMO competidor) {
        try {
        CompetidorMO creado = competidorService.crear(competidor);
        return ResponseEntity.ok(creado);

        } catch (ResponseStatusException ex) {
            return ResponseEntity
                .status(ex.getStatusCode())
                .body(ex.getReason());
        }
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