package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.*;

import com.Votify.backend.dto.AsignarCompetidorEventoRequest;
import com.Votify.backend.model.CompetidorEventoMO;
import com.Votify.backend.service.CompetidorEventoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/competidor-evento")
@RequiredArgsConstructor
public class CompetidorEventoController {

    private final CompetidorEventoService competidorEventoService;

    @PostMapping
    public CompetidorEventoMO asignar(@RequestBody AsignarCompetidorEventoRequest request) {
        return competidorEventoService.asignarCompetidorAEquipoEnEvento(
            request.competidorId(),
            request.eventoId(),
            request.equipoId()
        );
    }

    @GetMapping("/evento/{eventoId}")
    public List<CompetidorEventoMO> getPorEvento(@PathVariable UUID eventoId) {
        return competidorEventoService.getAsignacionesPorEvento(eventoId);
    }

    @GetMapping("/equipo/{equipoId}")
    public List<CompetidorEventoMO> getPorEquipo(@PathVariable UUID equipoId) {
        return competidorEventoService.getAsignacionesPorEquipo(equipoId);
    }

    @GetMapping("/competidor/{competidorId}")
    public List<CompetidorEventoMO> getPorCompetidor(@PathVariable UUID competidorId) {
        return competidorEventoService.getAsignacionesPorCompetidor(competidorId);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable UUID id) {
        competidorEventoService.eliminarAsignacion(id);
    }
}
