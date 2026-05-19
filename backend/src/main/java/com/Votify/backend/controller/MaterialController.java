package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.MaterialRequest;
import com.Votify.backend.model.MaterialMO;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.MaterialService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/material")
@RequiredArgsConstructor
public class MaterialController extends GenericController<MaterialMO> {

    private final MaterialService materialService;

    @Override
    protected GenericService<MaterialMO> getService() {
        return materialService;
    }

    @PostMapping("/subida")
    public List<MaterialMO> subidaFicheros(@ModelAttribute MaterialRequest request) {
        return materialService.subidaFicheros(request.proyectoId(), request.files());
    }

    @GetMapping("/proyecto/{proyectoId}")
    public List<MaterialMO> getByProyectoId(@PathVariable UUID proyectoId) {
        return materialService.findByProyectoId(proyectoId);
    }

    @GetMapping("/{id}/descargar")
    public ResponseEntity<Resource> descargarArchivo(@PathVariable UUID id) {
        return materialService.descargarArchivo(id);
    }
}