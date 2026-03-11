package com.Votify.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.OrganizadorMO;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.OrganizadorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/organizadores")
@RequiredArgsConstructor
public class OrganizadorController extends GenericController<OrganizadorMO>{

    private final OrganizadorService organizadorService;

    @Override
    protected GenericService<OrganizadorMO> getService(){

        return organizadorService;

    }

    @PostMapping
    public OrganizadorMO create(@RequestBody OrganizadorMO organizador){

        return organizadorService.save(organizador);

    }
}
