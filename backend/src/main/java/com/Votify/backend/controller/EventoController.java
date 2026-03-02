package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.Evento;
import com.Votify.backend.service.EventoService;

import lombok.RequiredArgsConstructor;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/eventos")
public class EventoController {
    
    private final EventoService eventoService;

    @GetMapping
    public List<Evento> getAll(){

        return eventoService.findAll();

    }

    @GetMapping("/{id}")
    public Evento getById(@PathVariable UUID id){

        return eventoService.findById(id);

    }

    @PostMapping
    public Evento create(@RequestHeader Evento evento){

        return eventoService.save(evento);

    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id){

        eventoService.delete(id);
        
    }
    
}
