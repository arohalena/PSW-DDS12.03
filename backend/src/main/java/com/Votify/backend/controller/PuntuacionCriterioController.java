package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.PuntuacionCriterioMO;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.PuntuacionCriterioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/puntuaciones")
@RequiredArgsConstructor
public class PuntuacionCriterioController extends GenericController<PuntuacionCriterioMO>{
    
    private final PuntuacionCriterioService puntuacionCriterioService;

    @Override
    protected GenericService<PuntuacionCriterioMO> getService(){

        return puntuacionCriterioService;

    }

    @PostMapping
    public PuntuacionCriterioMO puntuar(@RequestBody PuntuacionCriterioMO puntuacion){

        return puntuacionCriterioService.puntuar(puntuacion);

    }

    @GetMapping("/votacion-proyecto/{vpId}")
    public List<PuntuacionCriterioMO> findByVotacionProyecto(@PathVariable UUID vpId){

        return puntuacionCriterioService.findByVotacionProyectoId(vpId);

    }
}
