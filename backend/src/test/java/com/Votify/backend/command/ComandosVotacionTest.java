package com.Votify.backend.command;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.service.VotacionService;

class ComandosVotacionTest {

    @Test
    void cerrarVotacionCommand_delegaEnVotacionServiceYDevuelveLaVotacion() {
        FakeVotacionService votacionService = new FakeVotacionService();
        UUID votacionId = UUID.randomUUID();
        votacionService.cerrarRespuesta = new VotacionMO();

        VotacionMO resultado = new CerrarVotacionCommand(votacionService, votacionId).execute();

        assertThat(resultado).isSameAs(votacionService.cerrarRespuesta);
        assertThat(votacionService.cerrarId).isEqualTo(votacionId);
    }

    @Test
    void publicarResultadosCommand_delegaEnVotacionServiceYDevuelveLaVotacion() {
        FakeVotacionService votacionService = new FakeVotacionService();
        UUID votacionId = UUID.randomUUID();
        votacionService.publicarRespuesta = new VotacionMO();

        VotacionMO resultado = new PublicarResultadosCommand(votacionService, votacionId).execute();

        assertThat(resultado).isSameAs(votacionService.publicarRespuesta);
        assertThat(votacionService.publicarId).isEqualTo(votacionId);
    }

    @Test
    void retirarPublicacionResultadosCommand_delegaEnVotacionServiceYDevuelveLaVotacion() {
        FakeVotacionService votacionService = new FakeVotacionService();
        UUID votacionId = UUID.randomUUID();
        votacionService.retirarRespuesta = new VotacionMO();

        VotacionMO resultado = new RetirarPublicacionResultadosCommand(votacionService, votacionId).execute();

        assertThat(resultado).isSameAs(votacionService.retirarRespuesta);
        assertThat(votacionService.retirarId).isEqualTo(votacionId);
    }

    static class FakeVotacionService extends VotacionService {
        UUID cerrarId;
        UUID publicarId;
        UUID retirarId;
        VotacionMO cerrarRespuesta;
        VotacionMO publicarRespuesta;
        VotacionMO retirarRespuesta;

        FakeVotacionService() {
            super(null, null, null, null);
        }

        @Override
        public VotacionMO cerrar(UUID id) {
            this.cerrarId = id;
            return cerrarRespuesta;
        }

        @Override
        public VotacionMO publicarResultados(UUID id) {
            this.publicarId = id;
            return publicarRespuesta;
        }

        @Override
        public VotacionMO retirarPublicacionResultados(UUID id) {
            this.retirarId = id;
            return retirarRespuesta;
        }
    }
}
