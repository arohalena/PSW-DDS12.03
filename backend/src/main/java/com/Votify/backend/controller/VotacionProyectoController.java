package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.VotacionProyecto;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.VotacionProyectoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/votacion-proyectos")
@RequiredArgsConstructor
public class VotacionProyectoController extends GenericController<VotacionProyecto>{
    
    private final VotacionProyectoService votacionProyectoService;

    @Override
    protected GenericService<VotacionProyecto> getService(){

        return votacionProyectoService;

    }

    @GetMapping("/votacion/{votacionId}")
    public List<VotacionProyecto> findByVotacion_Id(@PathVariable UUID votacionId){

        return votacionProyectoService.findByVotacion_Id(votacionId);

    }

    @GetMapping("/proyecto/{proyectoId}")
    public List<VotacionProyecto> findByProyecto_Id(@PathVariable UUID proyectoId){

        return votacionProyectoService.findByProyecto_Id(proyectoId);

    }

    @PostMapping
    public VotacionProyecto create(@RequestBody VotacionProyecto votacionProyecto){

        return votacionProyectoService.save(votacionProyecto);

    }
    
}

