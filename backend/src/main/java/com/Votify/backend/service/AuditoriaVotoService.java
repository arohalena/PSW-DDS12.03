package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.dto.IntegridadAuditoriaDTO;
import com.Votify.backend.dto.ResumenAuditoriaProyectoDTO;
import com.Votify.backend.model.AuditoriaVotoMO;
import com.Votify.backend.repository.AuditoriaVotoRepository;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditoriaVotoService extends GenericService<AuditoriaVotoMO> {

    private final AuditoriaVotoRepository auditoriaVotoRepository;
    private final VotoRepository votoRepository;

    @Override
    protected JpaRepository<AuditoriaVotoMO, UUID> getRepository() {
        return auditoriaVotoRepository;
    }

    public List<AuditoriaVotoMO> findByVotacion(UUID votacionId) {
        return auditoriaVotoRepository.findByVotacionId(votacionId);
    }

    public List<ResumenAuditoriaProyectoDTO> resumenPorProyecto(UUID votacionId) {
        return auditoriaVotoRepository.contarPorProyecto(votacionId).stream()
            .map(row -> new ResumenAuditoriaProyectoDTO(
                (UUID) row[0],
                ((Number) row[1]).longValue()
            ))
            .toList();
    }

    public IntegridadAuditoriaDTO comprobarIntegridad(UUID votacionId) {
        long votos = votoRepository.countByVotacionProyecto_Votacion_Id(votacionId);
        long auditoria = auditoriaVotoRepository.countByVotacionId(votacionId);
        return new IntegridadAuditoriaDTO(votacionId, votos, auditoria, votos == auditoria);
    }
}