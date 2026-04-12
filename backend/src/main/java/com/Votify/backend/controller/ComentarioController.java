package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.service.ComentarioService;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.dto.ComentarioRequest;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.service.ProyectoService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/comentarios")
public class ComentarioController extends GenericController<ComentarioMO>{

    private final ComentarioService comentarioService;
    private final ProyectoService proyectoService;

    @Override
    protected GenericService<ComentarioMO> getService(){

        return comentarioService;
        
    }

    @PostMapping
    public ComentarioMO create(@RequestBody ComentarioRequest comentarioR){

        ProyectoMO proyecto = proyectoService.findById(comentarioR.getProyectoId());

        ComentarioMO comentario = new ComentarioMO();

        comentario.setProyecto(proyecto);
        comentario.setTexto(comentarioR.getTexto());
        comentario.setAnonTokenHash(UUID.randomUUID().toString());

        return comentarioService.save(comentario);

    }

    @GetMapping("/votacion-proyecto/{votacionProyectoId}")
    public List<ComentarioMO> findByVotacionProyecto_Id(UUID votacionProyectoId){

        return comentarioService.findByVotacionProyecto(votacionProyectoId);

    }

    @GetMapping("/proyecto/{proyectoId}")
    public List<ComentarioMO> findByProyecto_Id(@PathVariable UUID proyectoId) {

        return comentarioService.findByProyecto(proyectoId);

    }
    
}
