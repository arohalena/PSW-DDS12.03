package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.service.CriterioEvaluacionService;
import com.Votify.backend.service.GenericService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/criterios")
@RequiredArgsConstructor
public class CriterioEvaluacionController extends GenericController<CriterioEvaluacionMO> {

    private final CriterioEvaluacionService criterioService;

    @Override
    protected GenericService<CriterioEvaluacionMO> getService(){

        return criterioService;

    }

    @GetMapping("/evento/{eventoId}")
    public List<CriterioEvaluacionMO> findByEventoId(@PathVariable UUID eventoId){

        return criterioService.findByEventoId(eventoId);

    }

    @PostMapping
    public CriterioEvaluacionMO create(@RequestBody CriterioEvaluacionMO criterio){

        return criterioService.crear(criterio);

    }

    @PutMapping("/{id}")
    public CriterioEvaluacionMO update(@PathVariable UUID id, @RequestBody CriterioEvaluacionMO criterio){

        return criterioService.actualizar(id, criterio);

    }

    @DeleteMapping("/evento/{eventoId}")
    public void deleteAllByEvento(@PathVariable UUID eventoId){

        criterioService.deleteAllByEventoId(eventoId);
        
    }
}
