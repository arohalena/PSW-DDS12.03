package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.*;

import com.Votify.backend.dto.EventoDTO;
import com.Votify.backend.model.Evento;
import com.Votify.backend.service.EventoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/eventos")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class EventoController {

    private final EventoService eventoService;

    @GetMapping
    public List<Evento> getAll() {
        return eventoService.findAll();
    }

    @GetMapping("/{id}")
    public Evento getById(@PathVariable UUID id) {
        return eventoService.findById(id);
    }

    @PostMapping
    public Evento create(@RequestBody EventoDTO dto) {
        return eventoService.createEvento(dto);
    }
}