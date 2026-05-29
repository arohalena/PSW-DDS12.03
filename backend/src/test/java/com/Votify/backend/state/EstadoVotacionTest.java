package com.Votify.backend.state;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;

class EstadoVotacionTest {

    private VotacionMO votacionEnEstado(EstadoVotacionMO estado) {
        VotacionMO votacion = new VotacionMO();
        votacion.setEstado(estado);
        return votacion;
    }

    @Test
    void factory_devuelveInstanciasCompartidasParaEstadosSinAtributos() {
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.PENDIENTE))
            .isSameAs(EstadoVotacionFactory.desde(EstadoVotacionMO.PENDIENTE));
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.ABIERTA))
            .isSameAs(EstadoVotacionFactory.desde(EstadoVotacionMO.ABIERTA));
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.PAUSADA))
            .isSameAs(EstadoVotacionFactory.desde(EstadoVotacionMO.PAUSADA));
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.CERRADA))
            .isSameAs(EstadoVotacionFactory.desde(EstadoVotacionMO.CERRADA));
    }

    @Test
    void pendiente_abrir_cambiaEstadoAAbierta() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PENDIENTE);

        votacion.abrir();

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.ABIERTA);
        assertThat(votacion.getEstadoActual()).isEqualTo(EstadoVotacionMO.ABIERTA);
    }

    @Test
    void abierta_pausar_cambiaEstadoAPausada() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.ABIERTA);

        votacion.pausar();

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.PAUSADA);
    }

    @Test
    void pausada_reanudar_cambiaEstadoAAbierta() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PAUSADA);

        votacion.reanudar();

        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.ABIERTA);
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
    void cerrada_publicarResultados_marcaResultadosPublicadosYFecha() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.CERRADA);

        votacion.publicarResultados();

        assertThat(votacion.isResultadosPublicados()).isTrue();
        assertThat(votacion.getFechaPublicacionResultados()).isNotNull();
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
    void pendiente_verificarExpiracion_siYaHaComenzadoAbreLaVotacion() {
        VotacionMO votacion = votacionEnEstado(EstadoVotacionMO.PENDIENTE);
        votacion.setInicio(OffsetDateTime.now().minusMinutes(5));
        votacion.setFin(OffsetDateTime.now().plusMinutes(5));

        boolean cambio = votacion.aplicarTransicionPorFechas();

        assertThat(cambio).isTrue();
        assertThat(votacion.getEstado()).isEqualTo(EstadoVotacionMO.ABIERTA);
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
