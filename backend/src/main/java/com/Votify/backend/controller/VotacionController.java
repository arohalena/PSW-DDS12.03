package com.Votify.backend.controller;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.VotacionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/votaciones")
@RequiredArgsConstructor
public class VotacionController extends GenericController<VotacionMO>{
    
    private final VotacionService votacionService;

    @Override
    protected GenericService<VotacionMO> getService(){

        return votacionService;
        
    }

    @GetMapping("/evento/{eventoId}")
    public List<VotacionMO> findByEvento_Id(@PathVariable UUID eventoId){

        return votacionService.findByEvento_Id(eventoId);

    }

    @PostMapping
    public VotacionMO create(@RequestBody VotacionMO votacion){

        return votacionService.save(votacion);

    }

}
