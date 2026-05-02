package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class VotoService extends GenericService<VotoMO> {

    private final VotoRepository votoRepository;

    @Override
    protected JpaRepository<VotoMO, UUID> getRepository() {
        return votoRepository;
    }

    public List<VotoMO> findByVotacionProyecto_Id(UUID votacionProyectoId) {
        return votoRepository.findByVotacionProyecto_Id(votacionProyectoId);
    }

    public long contarVotosPorVotacionProyecto(UUID votacionProyectoId) {
        return votoRepository.countByVotacionProyecto_Id(votacionProyectoId);
    }

    public boolean yaHaVotado(UUID votacionProyectoId, String anonTokenHash) {
        if (anonTokenHash == null || anonTokenHash.isBlank()) return false;
        return votoRepository.existsByVotacionProyecto_IdAndAnonTokenHash(votacionProyectoId, anonTokenHash);
    }

    public long contarVotosEmitidosEnVotacion(UUID votacionId, String anonTokenHash) {
        return votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(votacionId, anonTokenHash);
    }

    public long contarVotantesUnicos(UUID eventoId) {
        return votoRepository.countDistinctVotantesByEventoId(eventoId);
    }
}