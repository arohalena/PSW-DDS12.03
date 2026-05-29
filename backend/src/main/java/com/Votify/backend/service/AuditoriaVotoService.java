package com.Votify.backend.service;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.dto.IntegridadAuditoriaDTO;
import com.Votify.backend.dto.RegistroAuditoriaDTO;
import com.Votify.backend.dto.ResumenAuditoriaProyectoDTO;
import com.Votify.backend.model.AuditoriaVotoMO;
import com.Votify.backend.model.VotoMO;
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
        long auditoria = auditoriaVotoRepository.countDistinctVotosAuditadosByVotacionId(votacionId);
        return new IntegridadAuditoriaDTO(votacionId, votos, auditoria, votos == auditoria);
    }

    public void registrarVotoSiNoExiste(VotoMO voto) {
        if (voto == null || voto.getId() == null || auditoriaVotoRepository.existsByVotoId(voto.getId())) {
            return;
        }

        AuditoriaVotoMO auditoria = new AuditoriaVotoMO();
        auditoria.setVotoId(voto.getId());
        auditoria.setVotacionId(voto.getVotacionProyecto().getVotacion().getId());
        auditoria.setProyectoId(voto.getVotacionProyecto().getProyecto().getId());
        auditoria.setAnonTokenHash(voto.getAnonTokenHash());
        auditoria.setAccion("INSERT");

        auditoriaVotoRepository.save(auditoria);
    }

    public List<RegistroAuditoriaDTO> registrosPorEvento(UUID eventoId, UUID votacionId) {
        return auditoriaVotoRepository.findEnriquecidosByEvento(eventoId, votacionId).stream()
            .map(this::mapearRegistro)
            .toList();
    }

    private RegistroAuditoriaDTO mapearRegistro(Object[] row) {
        UUID votanteId = (UUID) row[6];
        String votanteNombre = (String) row[7];
        boolean anonimo = votanteId == null;

        return new RegistroAuditoriaDTO(
            (UUID) row[0],
            (UUID) row[1],
            toOffsetDateTime(row[2]),
            (String) row[3],
            (UUID) row[4],
            (String) row[5],
            votanteId,
            votanteNombre,
            anonimo
        );
    }

    private OffsetDateTime toOffsetDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof OffsetDateTime odt) return odt;
        if (value instanceof Timestamp ts) return ts.toInstant().atOffset(ZoneOffset.UTC);
        return OffsetDateTime.parse(value.toString());
    }
}
