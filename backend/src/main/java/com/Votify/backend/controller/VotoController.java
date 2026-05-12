package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.EmitirEvaluacionRequest;
import com.Votify.backend.dto.EmitirVotoPuntosRequest;
import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.facade.VotoFacade;
import com.Votify.backend.model.VotoMO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/votos")
public class VotoController {

    private final VotoFacade votoFacade;

    @GetMapping
    public List<VotoMO> getAll() {
        return votoFacade.findAll();
    }

    @GetMapping("/{id}")
    public VotoMO getById(@PathVariable UUID id) {
        return votoFacade.findById(id);
    }

    // DELETE eliminado puesto que los votos son inmutables

    @GetMapping("/votacion-proyecto/{votacionProyectoId}")
    public List<VotoMO> findByVotacionProyecto_Id(@PathVariable UUID votacionProyectoId) {
        return votoFacade.findByVotacionProyecto_Id(votacionProyectoId);
    }

    @GetMapping("/votacion-proyecto/{votacionProyectoId}/count")
    public long countByVotacionProyecto(@PathVariable UUID votacionProyectoId) {
        return votoFacade.contarVotosPorVotacionProyecto(votacionProyectoId);
    }

    @GetMapping("/votacion-proyecto/{votacionProyectoId}/ya-votado")
    public boolean yaHaVotado(@PathVariable UUID votacionProyectoId, @RequestParam String token) {
        return votoFacade.yaHaVotado(votacionProyectoId, token);
    }

    @GetMapping("/votacion/{votacionId}/ha-alcanzado-maximo")
    public boolean haAlcanzadoMaximo(@PathVariable UUID votacionId, @RequestParam String token) {
        return votoFacade.haAlcanzadoMaximo(votacionId, token);
    }

    @GetMapping("/evento/{eventoId}/votantes")
    public long contarVotantesPorEvento(@PathVariable UUID eventoId) {
        return votoFacade.contarVotantesUnicos(eventoId);
    }

    @PostMapping("/simple")
    public VotoMO votarSimple(@RequestBody EmitirVotoSimpleRequest request) {
        return votoFacade.votarSimple(request);
    }

    @PostMapping("/multicriterio")
    public VotoMO votarMulticriterio(@RequestBody EmitirEvaluacionRequest request) {
        return votoFacade.votarMulticriterio(request);
    }

    @PostMapping("/puntos")
    public VotoMO votarPuntos(@RequestBody EmitirVotoPuntosRequest request) {
        return votoFacade.votarPuntos(request);
    }
}