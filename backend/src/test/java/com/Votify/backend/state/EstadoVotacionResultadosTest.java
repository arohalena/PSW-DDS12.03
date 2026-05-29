package com.Votify.backend.state;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;

class EstadoVotacionResultadosTest {

    private VotacionMO votacionEnEstado(EstadoVotacionMO estado) {
        VotacionMO votacion = new VotacionMO();
        votacion.setEstado(estado);
        return votacion;
    }

    @Test
    void cerrada_publicarResultados_marcaResultadosPublicadosYFecha() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.CERRADA);

        votacion.publicarResultados();

        assertThat(votacion.isResultadosPublicados()).isTrue();
        assertThat(votacion.getFechaPublicacionResultados()).isNotNull();
    }

    @Test
    void pendiente_publicarResultados_noEstaPermitido() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PENDIENTE);

        assertThatThrownBy(votacion::publicarResultados)
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Solo se pueden publicar resultados");

        assertThat(votacion.isResultadosPublicados()).isFalse();
    }

    @Test
    void abierta_publicarResultados_noEstaPermitido() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.ABIERTA);

        assertThatThrownBy(votacion::publicarResultados)
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Solo se pueden publicar resultados");

        assertThat(votacion.isResultadosPublicados()).isFalse();
    }

    @Test
    void pausada_publicarResultados_noEstaPermitido() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PAUSADA);

        assertThatThrownBy(votacion::publicarResultados)
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Solo se pueden publicar resultados");

        assertThat(votacion.isResultadosPublicados()).isFalse();
    }
}
