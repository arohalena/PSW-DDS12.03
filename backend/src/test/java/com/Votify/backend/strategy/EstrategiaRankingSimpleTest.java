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

import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

@ExtendWith(MockitoExtension.class)
class EstrategiaRankingSimpleTest {

    @Mock private EquipoRepository equipoRepository;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoRepository votoRepository;

    @InjectMocks private EstrategiaRankingSimple estrategia;

    @Test
    void calcular_devuelveTotalVotosComoPuntuacion() {

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

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(5L);
        when(votoRepository.countByVotacionProyecto_Id(vp.getId())).thenReturn(3L);
        when(equipoRepository.findByProyecto_Id(proyecto.getId())).thenReturn(equipo);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        assertThat(ranking).hasSize(1);
        Map<String, Object> entry = ranking.get(0);
        assertThat(entry.get("totalVotos")).isEqualTo(3L);
        assertThat(entry.get("puntuacionTotal")).isEqualTo(3.0);
        assertThat(entry.get("proyectoNombre")).isEqualTo("Proyecto A");
        assertThat(entry.get("equipoNombre")).isEqualTo("Equipo X");
        assertThat(entry.get("votantesActivos")).isEqualTo(5L);
    }

    @Test
    void calcular_sinProyectos_devuelveListaVacia() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of());
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(0L);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        assertThat(ranking).isEmpty();
    }
}