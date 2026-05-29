package com.Votify.backend.command;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotoMO;

class VotifyCommandFactoryTest {

    @Test
    void factory_creaComandosConfiguradosConSusReceivers() {
        ComandosVotoTest.FakeVotoFacade votoFacade = new ComandosVotoTest.FakeVotoFacade();
        ComandosVotacionTest.FakeVotacionService votacionService = new ComandosVotacionTest.FakeVotacionService();
        VotifyCommandFactory factory = new VotifyCommandFactory(votoFacade, votacionService);
        EmitirVotoSimpleRequest votoRequest = new EmitirVotoSimpleRequest(
            UUID.randomUUID(), "token", UUID.randomUUID(), null
        );
        UUID votacionId = UUID.randomUUID();
        votoFacade.votoSimpleRespuesta = new VotoMO();
        votacionService.publicarRespuesta = new VotacionMO();

        VotoMO voto = factory.emitirVotoSimple(votoRequest).execute();
        VotacionMO votacion = factory.publicarResultados(votacionId).execute();

        assertThat(voto).isSameAs(votoFacade.votoSimpleRespuesta);
        assertThat(votacion).isSameAs(votacionService.publicarRespuesta);
        assertThat(votoFacade.votoSimpleRequest).isSameAs(votoRequest);
        assertThat(votacionService.publicarId).isEqualTo(votacionId);
    }
}
