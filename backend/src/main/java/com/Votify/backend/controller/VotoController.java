package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.VotoMO;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.VotoService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/votos")
public class VotoController extends GenericController<VotoMO>{
    
    private final VotoService votoService;

    @Override
    protected GenericService<VotoMO> getService() {

        return votoService;

    }

    @GetMapping("/votacion-proyecto/{votacionProyectoId}")
    public List<VotoMO> findByVotacionProyecto_Id(@PathVariable UUID votacionProyectoId){

        return votoService.findByVotacionProyecto_Id(votacionProyectoId);

    }

    @GetMapping("/votacion-proyecto/{votacionProyectoId}/count")
    public long countByVotacionProyecto(@PathVariable UUID votacionProyectoId) {
        return votoService.contarVotosPorVotacionProyecto(votacionProyectoId);
    }
    
    @PostMapping
    public VotoMO create(@RequestBody VotoMO voto){

        return votoService.votar(voto);

    }

}
