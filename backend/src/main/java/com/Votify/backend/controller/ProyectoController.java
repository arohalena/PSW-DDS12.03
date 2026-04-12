package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.ProyectoService;

import lombok.RequiredArgsConstructor;





@RestController
@RequestMapping("/api/proyectos")
@RequiredArgsConstructor
public class ProyectoController extends GenericController<ProyectoMO>{

    private final ProyectoService proyectoService;

    @Override
    protected GenericService<ProyectoMO> getService(){

        return proyectoService;

    }

    @GetMapping("/evento/{eventoId}")
    public List<ProyectoMO> getByEvento_Id(@PathVariable UUID eventoId){

        return proyectoService.findByEvento_Id(eventoId);

    }

    @PostMapping("/crear")
    public ProyectoMO crear(@RequestBody ProyectoMO proyecto){

        return proyectoService.crear(proyecto);
    }    
}
