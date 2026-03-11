package com.Votify.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.CrearEventoPeticion;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.service.EventoService;
import com.Votify.backend.service.GenericService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
public class EventoController extends GenericController<EventoMO>{
    
    private final EventoService eventoService;

    @Override
    protected GenericService<EventoMO> getService(){

        return eventoService;
        
    }

    @PostMapping("/crear")
    public com.Votify.backend.model.EventoMO crear(@RequestBody CrearEventoPeticion body){

        return eventoService.crear(

            body.tipo(),
            body.nombre(),
            body.descripcion(),
            body.codigoAccesoPublico(),
            body.fecha_inicio(),
            body.fecha_fin()

        );
    }

}
