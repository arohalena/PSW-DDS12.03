package com.Votify.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.PuntuacionCriterioMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoRepository;
import com.Votify.backend.repository.EquipoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final CriterioEvaluacionRepository criterioRepository;
    private final PuntuacionCriterioRepository puntuacionRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoRepository votoRepository;
    private final EquipoRepository equipoRepository;

    public List<Map<String, Object>> calcularRanking(UUID eventoId, UUID votacionId) {

        List<CriterioEvaluacionMO> criterios = criterioRepository.findByEvento_IdOrderByOrdenAsc(eventoId);
        List<VotacionProyectoMO> proyectosVotacion = votacionProyectoRepository.findByVotacion_Id(votacionId);

        List<Map<String, Object>> ranking = new ArrayList<>();
        long votantesActivos = votoRepository.countDistinctVotantesByEventoId(eventoId);

        for (VotacionProyectoMO vp : proyectosVotacion) {

            Map<String, Object> entry = new LinkedHashMap<>();

            entry.put("proyectoId", vp.getProyecto().getId());
            entry.put("proyectoNombre", vp.getProyecto().getNombre());
            entry.put("votacionProyectoId", vp.getId());

            EquipoMO equipo = equipoRepository.findByProyecto_Id(vp.getProyecto().getId());
            entry.put("equipoNombre", equipo != null ? equipo.getNombre() : null);

            long totalVotosProyecto = votoRepository.countByVotacionProyecto_Id(vp.getId());
            entry.put("totalVotos", totalVotosProyecto);
            
            entry.put("votantesActivos", votantesActivos);
            
            double puntuacionTotal = 0;

            List<Map<String, Object>> detalleCriterios = new ArrayList<>();

            for (CriterioEvaluacionMO criterio : criterios) {

                Double promedio = puntuacionRepository.promedioByCriterioAndVotacionProyecto(criterio.getId(), vp.getId());
                double avg = promedio != null ? promedio : 0;
                double ponderado = avg * criterio.getPeso() / 100.0;

                puntuacionTotal += ponderado;

                Map<String, Object> detalle = new LinkedHashMap<>();

                detalle.put("criterioId", criterio.getId());
                detalle.put("criterioNombre", criterio.getNombre());
                detalle.put("peso", criterio.getPeso());
                detalle.put("promedio", Math.round(avg * 100.0) / 100.0);
                detalle.put("ponderado", Math.round(ponderado * 100.0) / 100.0);

                detalleCriterios.add(detalle);

            }

            entry.put("puntuacionTotal", Math.round(puntuacionTotal * 100.0) / 100.0);
            entry.put("criterios", detalleCriterios);

            ranking.add(entry);
        }

        ranking.sort((a, b) -> Double.compare((double) b.get("puntuacionTotal"), (double) a.get("puntuacionTotal")));

        for (int i = 0; i < ranking.size(); i++) {

            ranking.get(i).put("posicion", i + 1);

        }

        return ranking;
        
    }
}
