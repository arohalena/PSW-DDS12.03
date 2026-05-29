package com.Votify.backend.command;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.Votify.backend.dto.EmitirEvaluacionRequest;
import com.Votify.backend.dto.EmitirVotoPuntosRequest;
import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.facade.VotoFacade;
import com.Votify.backend.service.VotacionService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class VotifyCommandFactory {
    private final VotoFacade votoFacade;
    private final VotacionService votacionService;

    public EmitirVotoSimpleCommand emitirVotoSimple(EmitirVotoSimpleRequest request) {
        return new EmitirVotoSimpleCommand(votoFacade, request);
    }

    public EmitirVotoPuntosCommand emitirVotoPuntos(EmitirVotoPuntosRequest request) {
        return new EmitirVotoPuntosCommand(votoFacade, request);
    }

    public EmitirVotoMulticriterioCommand emitirVotoMulticriterio(EmitirEvaluacionRequest request) {
        return new EmitirVotoMulticriterioCommand(votoFacade, request);
    }

    public CerrarVotacionCommand cerrarVotacion(UUID votacionId) {
        return new CerrarVotacionCommand(votacionService, votacionId);
    }

    public PublicarResultadosCommand publicarResultados(UUID votacionId) {
        return new PublicarResultadosCommand(votacionService, votacionId);
    }

    public RetirarPublicacionResultadosCommand retirarPublicacionResultados(UUID votacionId) {
        return new RetirarPublicacionResultadosCommand(votacionService, votacionId);
    }
}
