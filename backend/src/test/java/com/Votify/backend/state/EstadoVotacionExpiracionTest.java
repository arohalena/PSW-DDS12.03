package com.Votify.backend.state;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;

class EstadoVotacionExpiracionTest {

    private VotacionMO votacionEnEstado(EstadoVotacionMO estado) {
        VotacionMO votacion = new VotacionMO();
        votacion.setEstado(estado);
        return votacion;
    }

    @Test
    void pendiente_verificarExpiracion_siYaHaComenzadoAbreLaVotacion() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PENDIENTE);
        votacion.setInicio(OffsetDateTime.now().minusMinutes(5));
        votacion.setFin(OffsetDateTime.now().plusMinutes(5));

        boolean cambio = votacion.aplicarTransicionPorFechas();

        assertThat(cambio).isTrue();
        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.ABIERTA);
    }

    @Test
    void pendiente_verificarExpiracion_siYaHaTerminadoCierraLaVotacion() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PENDIENTE);
        votacion.setInicio(OffsetDateTime.now().minusHours(2));
        votacion.setFin(OffsetDateTime.now().minusMinutes(1));

        boolean cambio = votacion.aplicarTransicionPorFechas();

        assertThat(cambio).isTrue();
        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.CERRADA);
    }

    @Test
    void abierta_verificarExpiracion_siHaFinalizadoCierraLaVotacion() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.ABIERTA);
        votacion.setFin(OffsetDateTime.now().minusMinutes(1));

        boolean cambio = votacion.aplicarTransicionPorFechas();

        assertThat(cambio).isTrue();
        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.CERRADA);
    }

    @Test
    void abierta_emitirVoto_siNoHaExpiradoNoLanzaError() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.ABIERTA);
        votacion.setFin(OffsetDateTime.now().plusMinutes(10));

        assertThatCode(votacion::emitirVoto).doesNotThrowAnyException();
        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.ABIERTA);
    }

    @Test
    void pausada_emitirVoto_noEstaPermitidoSiNoHaExpirado() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PAUSADA);
        votacion.setFin(OffsetDateTime.now().plusMinutes(10));

        assertThatThrownBy(votacion::emitirVoto)
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("pausada");

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.PAUSADA);
    }
}
