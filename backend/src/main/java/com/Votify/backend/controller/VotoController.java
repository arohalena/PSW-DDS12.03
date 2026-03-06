package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.Voto;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.VotoService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/votos")
public class VotoController extends GenericController<Voto>{
    
    private final VotoService votoService;

    @Override
    protected GenericService<Voto> getService() {

        return votoService;

    }

    @GetMapping("/votacion-proyecto/{votacionProyectoId}")
    public List<Voto> findByVotacionProyecto_Id(UUID votacionProyectoId){

        return votoService.findByVotacionProyecto_Id(votacionProyectoId);

    }

    @PostMapping
    public Voto create(@RequestBody Voto voto){

        return votoService.save(voto);

    }

}
