package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

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

    public List<Object[]> contarPorProyecto(UUID votacionId) {
        return auditoriaVotoRepository.contarPorProyecto(votacionId);
    }

    public long totalAuditoria(UUID votacionId) {
        return auditoriaVotoRepository.countByVotacionId(votacionId);
    }

    public long totalVotos(UUID votacionId) {
        return votoRepository.countByVotacionProyecto_Votacion_Id(votacionId);
    }
    
}