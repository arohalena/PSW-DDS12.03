package com.Votify.backend.state;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.Votify.backend.model.EstadoVotacionMO;

class EstadoVotacionFactoryTest {

    @Test
    void desde_null_devuelveEstadoPendiente() {
        EstadoVotacion estado = EstadoVotacionFactory.desde(null);

        assertThat(estado.tipo()).isEqualTo(EstadoVotacionMO.PENDIENTE);
    }

    @Test
    void desde_devuelveTipoCorrectoParaCadaEstadoPersistido() {
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.PENDIENTE).tipo())
            .isEqualTo(EstadoVotacionMO.PENDIENTE);
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.ABIERTA).tipo())
            .isEqualTo(EstadoVotacionMO.ABIERTA);
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.PAUSADA).tipo())
            .isEqualTo(EstadoVotacionMO.PAUSADA);
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.CERRADA).tipo())
            .isEqualTo(EstadoVotacionMO.CERRADA);
    }

    @Test
    void desde_reutilizaInstanciasCompartidasParaEstadosSinAtributos() {
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.PENDIENTE))
            .isSameAs(EstadoVotacionFactory.desde(EstadoVotacionMO.PENDIENTE));
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.ABIERTA))
            .isSameAs(EstadoVotacionFactory.desde(EstadoVotacionMO.ABIERTA));
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.PAUSADA))
            .isSameAs(EstadoVotacionFactory.desde(EstadoVotacionMO.PAUSADA));
        assertThat(EstadoVotacionFactory.desde(EstadoVotacionMO.CERRADA))
            .isSameAs(EstadoVotacionFactory.desde(EstadoVotacionMO.CERRADA));
    }
}
