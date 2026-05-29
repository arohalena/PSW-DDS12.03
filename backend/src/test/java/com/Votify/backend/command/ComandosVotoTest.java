package com.Votify.backend.command;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.Votify.backend.dto.EmitirEvaluacionRequest;
import com.Votify.backend.dto.EmitirVotoPuntosRequest;
import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.facade.VotoFacade;
import com.Votify.backend.model.VotoMO;

class ComandosVotoTest {

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

    static class FakeVotoFacade extends VotoFacade {
        EmitirVotoSimpleRequest votoSimpleRequest;
        EmitirVotoPuntosRequest votoPuntosRequest;
        EmitirEvaluacionRequest votoMulticriterioRequest;
        VotoMO votoSimpleRespuesta;
        VotoMO votoPuntosRespuesta;
        VotoMO votoMulticriterioRespuesta;

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
}
