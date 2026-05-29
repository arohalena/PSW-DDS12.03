package com.Votify.backend.command;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.Votify.backend.dto.EmitirEvaluacionRequest;
import com.Votify.backend.dto.EmitirVotoPuntosRequest;
import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.facade.VotoFacade;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.service.VotacionService;

class CommandPatternTest {

    @Test
    void invoker_ejecutaComandoSinConocerLaOperacionConcreta() {
        CommandInvoker invoker = new CommandInvoker();
        VotifyCommand<String> command = () -> "ejecutado";

        String resultado = invoker.execute(command);

        assertThat(resultado).isEqualTo("ejecutado");
    }

    @Test
    void emitirVotoSimpleCommand_delegaEnVotoFacadeYDevuelveElVoto() {
        FakeVotoFacade votoFacade = new FakeVotoFacade();
        EmitirVotoSimpleRequest request = new EmitirVotoSimpleRequest(
            UUID.randomUUID(), "token-simple", UUID.randomUUID(), "Comentario"
        );
        votoFacade.votoSimpleRespuesta = new VotoMO();

        VotoMO resultado = new EmitirVotoSimpleCommand(votoFacade, request).execute();

        assertThat(resultado).isSameAs(votoFacade.votoSimpleRespuesta);
        assertThat(votoFacade.votoSimpleRequest).isSameAs(request);
    }

    @Test
    void emitirVotoPuntosCommand_delegaEnVotoFacadeYDevuelveElVoto() {
        FakeVotoFacade votoFacade = new FakeVotoFacade();
        EmitirVotoPuntosRequest request = new EmitirVotoPuntosRequest(
            UUID.randomUUID(), "token-puntos", UUID.randomUUID(), 5, "Comentario"
        );
        votoFacade.votoPuntosRespuesta = new VotoMO();

        VotoMO resultado = new EmitirVotoPuntosCommand(votoFacade, request).execute();

        assertThat(resultado).isSameAs(votoFacade.votoPuntosRespuesta);
        assertThat(votoFacade.votoPuntosRequest).isSameAs(request);
    }

    @Test
    void emitirVotoMulticriterioCommand_delegaEnVotoFacadeYDevuelveElVoto() {
        FakeVotoFacade votoFacade = new FakeVotoFacade();
        EmitirEvaluacionRequest request = new EmitirEvaluacionRequest(
            UUID.randomUUID(), "token-multi", UUID.randomUUID(), "Comentario", List.of()
        );
        votoFacade.votoMulticriterioRespuesta = new VotoMO();

        VotoMO resultado = new EmitirVotoMulticriterioCommand(votoFacade, request).execute();

        assertThat(resultado).isSameAs(votoFacade.votoMulticriterioRespuesta);
        assertThat(votoFacade.votoMulticriterioRequest).isSameAs(request);
    }

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

    @Test
    void factory_creaComandosConfiguradosConSusReceivers() {
        FakeVotoFacade votoFacade = new FakeVotoFacade();
        FakeVotacionService votacionService = new FakeVotacionService();
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

    private static class FakeVotoFacade extends VotoFacade {
        private EmitirVotoSimpleRequest votoSimpleRequest;
        private EmitirVotoPuntosRequest votoPuntosRequest;
        private EmitirEvaluacionRequest votoMulticriterioRequest;
        private VotoMO votoSimpleRespuesta;
        private VotoMO votoPuntosRespuesta;
        private VotoMO votoMulticriterioRespuesta;

        FakeVotoFacade() {
            super(null, null, null, null, null, null, null, null);
        }

        @Override
        public VotoMO votarSimple(EmitirVotoSimpleRequest request) {
            this.votoSimpleRequest = request;
            return votoSimpleRespuesta;
        }

        @Override
        public VotoMO votarPuntos(EmitirVotoPuntosRequest request) {
            this.votoPuntosRequest = request;
            return votoPuntosRespuesta;
        }

        @Override
        public VotoMO votarMulticriterio(EmitirEvaluacionRequest request) {
            this.votoMulticriterioRequest = request;
            return votoMulticriterioRespuesta;
        }
    }

    private static class FakeVotacionService extends VotacionService {
        private UUID cerrarId;
        private UUID publicarId;
        private UUID retirarId;
        private VotacionMO cerrarRespuesta;
        private VotacionMO publicarRespuesta;
        private VotacionMO retirarRespuesta;

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

