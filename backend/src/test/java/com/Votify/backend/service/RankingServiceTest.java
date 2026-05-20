package com.Votify.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.ModoRankingMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoRepository;
import com.Votify.backend.strategy.EstrategiaRankingMulticriterio;
import com.Votify.backend.strategy.EstrategiaRankingMulticriterioPonderada;
import com.Votify.backend.strategy.EstrategiaRankingPuntos;
import com.Votify.backend.strategy.EstrategiaRankingSimple;

@ExtendWith(MockitoExtension.class)
class RankingServiceTest {

    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoRepository votoRepository;
    @Mock private EquipoRepository equipoRepository;
    @Mock private VotacionRepository votacionRepository;
    @Mock private UsuarioRepository usuarioRepository;

    @Mock private EstrategiaRankingSimple estrategiaSimple;
    @Mock private EstrategiaRankingPuntos estrategiaPuntos;
    @Mock private EstrategiaRankingMulticriterio estrategiaMulticriterio;
    @Mock private EstrategiaRankingMulticriterioPonderada estrategiaMulticriterioPonderada;

    @InjectMocks private RankingService rankingService;

    private VotacionMO votacionConModalidad(ModalidadVotacionMO modalidad) {
        VotacionMO v = new VotacionMO();
        v.setId(UUID.randomUUID());
        v.setModalidad(modalidad);
        v.setTipo(TipoVotacionMO.POPULAR);
        v.setModoRanking(ModoRankingMO.AUTOMATICO);
        return v;
    }

    @Test
    void calcularRanking_modalidadSimple_delegaSoloEnEstrategiaSimple() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();
        VotacionMO votacion = votacionConModalidad(ModalidadVotacionMO.SIMPLE);

        when(votacionRepository.findById(votacionId)).thenReturn(Optional.of(votacion));
        when(estrategiaSimple.calcular(eventoId, votacionId)).thenReturn(List.<Map<String, Object>>of());

        rankingService.calcularRanking(eventoId, votacionId);

        verify(estrategiaSimple).calcular(eventoId, votacionId);
        verify(estrategiaPuntos, never()).calcular(eventoId, votacionId);
        verify(estrategiaMulticriterio, never()).calcular(eventoId, votacionId);
        verify(estrategiaMulticriterioPonderada, never()).calcular(eventoId, votacionId);
    }

    @Test
    void calcularRanking_modalidadPuntos_delegaSoloEnEstrategiaPuntos() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();
        VotacionMO votacion = votacionConModalidad(ModalidadVotacionMO.PUNTOS);

        when(votacionRepository.findById(votacionId)).thenReturn(Optional.of(votacion));
        when(estrategiaPuntos.calcular(eventoId, votacionId)).thenReturn(List.<Map<String, Object>>of());

        rankingService.calcularRanking(eventoId, votacionId);

        verify(estrategiaPuntos).calcular(eventoId, votacionId);
        verify(estrategiaSimple, never()).calcular(eventoId, votacionId);
        verify(estrategiaMulticriterio, never()).calcular(eventoId, votacionId);
        verify(estrategiaMulticriterioPonderada, never()).calcular(eventoId, votacionId);
    }

    @Test
    void calcularRanking_modalidadMulticriterio_delegaSoloEnEstrategiaMulticriterio() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();
        VotacionMO votacion = votacionConModalidad(ModalidadVotacionMO.MULTICRITERIO);

        when(votacionRepository.findById(votacionId)).thenReturn(Optional.of(votacion));
        when(estrategiaMulticriterio.calcular(eventoId, votacionId)).thenReturn(List.<Map<String, Object>>of());

        rankingService.calcularRanking(eventoId, votacionId);

        verify(estrategiaMulticriterio).calcular(eventoId, votacionId);
        verify(estrategiaSimple, never()).calcular(eventoId, votacionId);
        verify(estrategiaPuntos, never()).calcular(eventoId, votacionId);
        verify(estrategiaMulticriterioPonderada, never()).calcular(eventoId, votacionId);
    }

    @Test
    void calcularRanking_modalidadMulticriterioPonderada_delegaSoloEnPonderada() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();
        VotacionMO votacion = votacionConModalidad(ModalidadVotacionMO.MULTICRITERIO_PONDERADA);

        when(votacionRepository.findById(votacionId)).thenReturn(Optional.of(votacion));
        when(estrategiaMulticriterioPonderada.calcular(eventoId, votacionId)).thenReturn(List.<Map<String, Object>>of());

        rankingService.calcularRanking(eventoId, votacionId);

        verify(estrategiaMulticriterioPonderada).calcular(eventoId, votacionId);
        verify(estrategiaSimple, never()).calcular(eventoId, votacionId);
        verify(estrategiaPuntos, never()).calcular(eventoId, votacionId);
        verify(estrategiaMulticriterio, never()).calcular(eventoId, votacionId);
    }

    @Test
    void calcularRanking_devuelveResultadoOrdenadoYNumerado() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();
        VotacionMO votacion = votacionConModalidad(ModalidadVotacionMO.SIMPLE);

        Map<String, Object> proyectoBajo = new java.util.LinkedHashMap<>();
        proyectoBajo.put("proyectoNombre", "Bajo");
        proyectoBajo.put("puntuacionTotal", 2.0);

        Map<String, Object> proyectoAlto = new java.util.LinkedHashMap<>();
        proyectoAlto.put("proyectoNombre", "Alto");
        proyectoAlto.put("puntuacionTotal", 7.0);

        when(votacionRepository.findById(votacionId)).thenReturn(Optional.of(votacion));
        when(estrategiaSimple.calcular(eventoId, votacionId))
            .thenReturn(List.of(proyectoBajo, proyectoAlto));

        List<Map<String, Object>> resultado = rankingService.calcularRanking(eventoId, votacionId);

        assertThat(resultado).hasSize(2);
        assertThat(resultado.get(0).get("proyectoNombre")).isEqualTo("Alto");
        assertThat(resultado.get(0).get("posicion")).isEqualTo(1);
        assertThat(resultado.get(1).get("proyectoNombre")).isEqualTo("Bajo");
        assertThat(resultado.get(1).get("posicion")).isEqualTo(2);
    }
}