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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.PlantillaSugerenciaDTO;
import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.service.CriterioEvaluacionService;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.SugerenciaCriterioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/criterios")
@RequiredArgsConstructor
public class CriterioEvaluacionController extends GenericController<CriterioEvaluacionMO> {

    private final CriterioEvaluacionService criterioService;
    private final SugerenciaCriterioService sugerenciaService;

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

    @GetMapping("/plantillas")
    public List<PlantillaSugerenciaDTO> listarPlantillas(){

        return sugerenciaService.listarPlantillas();

    }

    @GetMapping("/plantillas/sugerencia")
    public PlantillaSugerenciaDTO sugerirPlantilla(
            @RequestParam(required = false) String descripcion,
            @RequestParam(required = false) String tipoEvento){

        return sugerenciaService.sugerir(descripcion, tipoEvento);

    }
}