package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.ComentarioRequest;
import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.service.ComentarioService;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.ProyectoService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/comentarios")
public class ComentarioController extends GenericController<ComentarioMO>{

    private final ComentarioService comentarioService;
    private final ProyectoService proyectoService;

    private final CompetidorRepository competidorRepository;
    private final CompetidorEventoRepository competidorEventoRepository;

    @Override
    protected GenericService<ComentarioMO> getService(){

        return comentarioService;
        
    }

    @PostMapping
    public ComentarioMO create(@RequestBody ComentarioRequest comentarioR){

        CompetidorMO competidor = competidorRepository.findByUsuarioId(comentarioR.getUsuarioId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.FORBIDDEN, "No eres un competidor registrado en ningún evento."
            ));
        
        ProyectoMO proyecto = proyectoService.findById(comentarioR.getProyectoId());
        
        UUID eventoId = proyecto.getEvento().getId();
        
        boolean vinculado = competidorEventoRepository.existsByCompetidorIdAndEventoId(competidor.getId(), eventoId);

        if(!vinculado){
            
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "No estás vinculado al evento de este proyecto."
            );

        }
        
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
