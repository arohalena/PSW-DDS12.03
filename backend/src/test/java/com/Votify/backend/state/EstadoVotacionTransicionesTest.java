package com.Votify.backend.state;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;

class EstadoVotacionTransicionesTest {

    private VotacionMO votacionEnEstado(EstadoVotacionMO estado) {
        VotacionMO votacion = new VotacionMO();
        votacion.setEstado(estado);
        return votacion;
    }

    @Test
    void pendiente_abrir_cambiaEstadoAAbierta() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PENDIENTE);

        votacion.abrir();

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.ABIERTA);
        assertThat(votacion.getEstadoActual()).isEqualTo(EstadoVotacionMO.ABIERTA);
    }

    @Test
    void pendiente_cerrar_cambiaEstadoACerrada() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PENDIENTE);

        votacion.cerrar();

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.CERRADA);
    }

    @Test
    void abierta_pausar_cambiaEstadoAPausada() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.ABIERTA);

        votacion.pausar();

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.PAUSADA);
    }

    @Test
    void abierta_cerrar_cambiaEstadoACerrada() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.ABIERTA);

        votacion.cerrar();

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.CERRADA);
    }

    @Test
    void pausada_reanudar_cambiaEstadoAAbierta() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PAUSADA);

        votacion.reanudar();

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.ABIERTA);
    }

    @Test
    void pausada_cerrar_cambiaEstadoACerrada() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PAUSADA);

        votacion.cerrar();

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.CERRADA);
    }

    @Test
    void cerrada_abrir_lanzaErrorYConservaEstadoCerrada() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.CERRADA);

        assertThatThrownBy(votacion::abrir)
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("No se puede abrir");

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.CERRADA);
    }

    @Test
    void cerrada_pausar_lanzaErrorYConservaEstadoCerrada() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.CERRADA);

        assertThatThrownBy(votacion::pausar)
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("No se puede pausar");

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.CERRADA);
    }
}
