package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.ComentarioRequest;
import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.service.ComentarioService;
import com.Votify.backend.service.GenericService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/comentarios")
public class ComentarioController extends GenericController<ComentarioMO>{

    private final ComentarioService comentarioService;

    @Override
    protected GenericService<ComentarioMO> getService(){

        return comentarioService;
        
    }

    @PostMapping
    public ComentarioMO create(@RequestBody ComentarioRequest req){

        return comentarioService.crear(req);

    }

    @GetMapping("/votacion-proyecto/{votacionProyectoId}")
    public List<ComentarioMO> findByVotacionProyecto_Id(@PathVariable UUID votacionProyectoId){

        return comentarioService.findByVotacionProyecto(votacionProyectoId);

    }

    @GetMapping("/proyecto/{proyectoId}")
    public List<ComentarioMO> findByProyecto_Id(@PathVariable UUID proyectoId){

        return comentarioService.findByProyecto(proyectoId);

    }
    
}
