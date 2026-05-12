package com.Votify.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.dto.IntegridadAuditoriaDTO;
import com.Votify.backend.dto.ResumenAuditoriaProyectoDTO;
import com.Votify.backend.model.AuditoriaVotoMO;
import com.Votify.backend.service.AuditoriaVotoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaVotoService auditoriaVotoService;

    @GetMapping("/votaciones/{id}/registros")
    public List<AuditoriaVotoMO> registrosDeVotacion(@PathVariable UUID id) {
        return auditoriaVotoService.findByVotacion(id);
    }

    @GetMapping("/votaciones/{id}/resumen")
    public List<ResumenAuditoriaProyectoDTO> resumen(@PathVariable UUID id) {
        return auditoriaVotoService.resumenPorProyecto(id);
    }

    @GetMapping("/votaciones/{id}/integridad")
    public IntegridadAuditoriaDTO integridad(@PathVariable UUID id) {
        return auditoriaVotoService.comprobarIntegridad(id);
    }
}