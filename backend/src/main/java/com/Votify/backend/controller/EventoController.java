package com.Votify.backend.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.Evento;
import com.Votify.backend.service.EventoService;
import com.Votify.backend.service.GenericService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
public class EventoController extends GenericController<Evento>{
    
    private final EventoService eventoService;

    @Override
    protected GenericService<Evento> getService(){

        return eventoService;
        
    }

    @PostMapping("/crear")
    public com.Votify.backend.model.Evento crear(@RequestBody Map<String, String> body){

        return eventoService.crear(

            body.get("tipo"),
            body.get("nombre"),
            body.get("codigoAccesoPublico"),
            body.get("descripcion")
        );
    }

}
