package com.Votify.backend.strategy;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

@ExtendWith(MockitoExtension.class)
class EstrategiaRankingMulticriterioPonderadaTest {

    @Mock private EquipoRepository equipoRepository;
    @Mock private CriterioEvaluacionRepository criterioRepository;
    @Mock private PuntuacionCriterioRepository puntuacionRepository;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoRepository votoRepository;

    @InjectMocks private EstrategiaRankingMulticriterioPonderada estrategia;

    @Test
    void calcular_aplicaPesosACadaCriterio() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(UUID.randomUUID());
        proyecto.setNombre("Proyecto A");

        VotacionProyectoMO vp = new VotacionProyectoMO();
        vp.setId(UUID.randomUUID());
        vp.setProyecto(proyecto);

        EquipoMO equipo = new EquipoMO();
        equipo.setNombre("Equipo X");

        CriterioEvaluacionMO c1 = new CriterioEvaluacionMO();
        c1.setId(UUID.randomUUID());
        c1.setNombre("Innovación");
        c1.setPeso(60);

        CriterioEvaluacionMO c2 = new CriterioEvaluacionMO();
        c2.setId(UUID.randomUUID());
        c2.setNombre("Viabilidad");
        c2.setPeso(40);

        when(criterioRepository.findByEvento_IdOrderByOrdenAsc(eventoId)).thenReturn(List.of(c1, c2));
        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(4L);
        when(votoRepository.countByVotacionProyecto_Id(vp.getId())).thenReturn(4L);
        when(puntuacionRepository.promedioByCriterioAndVotacionProyecto(c1.getId(), vp.getId())).thenReturn(8.0);
        when(puntuacionRepository.promedioByCriterioAndVotacionProyecto(c2.getId(), vp.getId())).thenReturn(6.0);
        when(equipoRepository.findByProyecto_Id(proyecto.getId())).thenReturn(equipo);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        assertThat(ranking).hasSize(1);
        Map<String, Object> entry = ranking.get(0);
        // Ponderado: 8 * 60/100 + 6 * 40/100 = 4.8 + 2.4 = 7.2
        assertThat(entry.get("puntuacionTotal")).isEqualTo(7.2);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> criterios = (List<Map<String, Object>>) entry.get("criterios");
        assertThat(criterios).hasSize(2);
        assertThat(criterios.get(0).get("peso")).isEqualTo(60);
        assertThat(criterios.get(0).get("ponderado")).isEqualTo(4.8);
        assertThat(criterios.get(1).get("peso")).isEqualTo(40);
        assertThat(criterios.get(1).get("ponderado")).isEqualTo(2.4);
    }
}