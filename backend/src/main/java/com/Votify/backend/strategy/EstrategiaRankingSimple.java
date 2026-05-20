package com.Votify.backend.strategy;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

@Component
public class EstrategiaRankingSimple extends EstrategiaCalculoRanking {

    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoRepository votoRepository;

    public EstrategiaRankingSimple(EquipoRepository equipoRepository,
                                   VotacionProyectoRepository votacionProyectoRepository,
                                   VotoRepository votoRepository) {
        super(equipoRepository);
        this.votacionProyectoRepository = votacionProyectoRepository;
        this.votoRepository = votoRepository;
    }

    @Override
    public List<Map<String, Object>> calcular(UUID eventoId, UUID votacionId) {

        List<VotacionProyectoMO> proyectosVotacion = votacionProyectoRepository.findByVotacion_Id(votacionId);
        long votantesActivos = votoRepository.countDistinctVotantesByEventoId(eventoId);

        List<Map<String, Object>> ranking = new ArrayList<>();

        for (VotacionProyectoMO vp : proyectosVotacion) {

            Map<String, Object> entry = baseEntry(vp, votantesActivos);

            long totalVotos = votoRepository.countByVotacionProyecto_Id(vp.getId());

            entry.put("totalVotos", totalVotos);
            entry.put("puntuacionTotal", (double) totalVotos);
            entry.put("criterios", new ArrayList<>());

            ranking.add(entry);
        }

        return ranking;
    }
}