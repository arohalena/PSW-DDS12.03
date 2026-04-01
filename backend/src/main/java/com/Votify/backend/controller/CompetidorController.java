package com.Votify.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.service.CompetidorService;
import com.Votify.backend.service.GenericService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/competidores")
@RequiredArgsConstructor
public class CompetidorController extends GenericController<CompetidorMO> {

    private final CompetidorService competidorService;

    @Override
    protected GenericService<CompetidorMO> getService() {
        return competidorService;
    }

    @PostMapping
    public CompetidorMO create(@RequestBody CompetidorMO competidor) {
        return competidorService.save(competidor);
    }
}