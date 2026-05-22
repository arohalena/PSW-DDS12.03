package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.chainOfResponsability.ValidadorVoto;
import com.Votify.backend.dto.VotoRequest;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class VotoService extends GenericService<VotoMO> {

    private final VotoRepository votoRepository;
    private final ValidadorVoto validadorVoto;

    @Override
    protected JpaRepository<VotoMO, UUID> getRepository() {
        return votoRepository;
    }

    // ============ Consultas ============

    public List<VotoMO> findByVotacionProyecto_Id(UUID votacionProyectoId) {
        return votoRepository.findByVotacionProyecto_Id(votacionProyectoId);
    }

    public void validarVoto(UUID usuarioId, UUID votacionId, UUID votacionProyectoId, String anonTokenHash, String comentario) {
        validarVoto(new VotoRequest(usuarioId, votacionId, votacionProyectoId, anonTokenHash, comentario));
    }

    public void validarVoto(VotoRequest request) {
        validadorVoto.validar(request);
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


       public boolean haAlcanzadoMaximo(VotacionProyectoMO referencia, String anonTokenHash) {
        long emitidos = contarVotosEmitidosEnVotacion(referencia.getVotacion().getId(), anonTokenHash);
        return emitidos >= referencia.getVotacion().getMaxSelecciones();
    }
}