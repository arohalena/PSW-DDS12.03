package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.Organizador;
import com.Votify.backend.service.OrganizadorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/organizadores")
@RequiredArgsConstructor
public class OrganizadorController {
    
    private final OrganizadorService organizadorService;

    @GetMapping
    public List<Organizador> getAll(){

        return organizadorService.findAll();

    }

    @GetMapping("/{id}")
    public Organizador getById(@PathVariable UUID id){

        return organizadorService.findById(id);

    }

    @PostMapping
    public Organizador create(@RequestBody Organizador organizador){

        return organizadorService.save(organizador);

    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id){

        organizadorService.delete(id);
        
    }
}
