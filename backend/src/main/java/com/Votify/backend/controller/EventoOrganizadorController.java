package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.EventoOrganizador;
import com.Votify.backend.service.EventoOrganizadorService;
import com.Votify.backend.service.GenericService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/evento-organizador")
@RequiredArgsConstructor
public class EventoOrganizadorController extends GenericController<EventoOrganizador>{
    
    private final EventoOrganizadorService eventoOrganizadorService;

    @Override
    protected GenericService<EventoOrganizador> getService(){

        return eventoOrganizadorService;

    }
    @GetMapping("/evento/{eventoId}")
    public List<EventoOrganizador> findByEvento_Id(UUID eventoId){

        return eventoOrganizadorService.findByEvento_Id(eventoId);
        
    }

    @PostMapping
    public EventoOrganizador create(@RequestBody EventoOrganizador eventoOrganizador){

        return eventoOrganizadorService.save(eventoOrganizador);

    }

    @GetMapping("/organizador/{organizadorId}")
    public List<EventoOrganizador> findByOrganizador_Id(UUID organizadorId){

        return eventoOrganizadorService.findByOrganizador_Id(organizadorId);

    }

}
