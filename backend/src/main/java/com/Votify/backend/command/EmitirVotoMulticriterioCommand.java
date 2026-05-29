package com.Votify.backend.command;

import com.Votify.backend.dto.EmitirEvaluacionRequest;
import com.Votify.backend.facade.VotoFacade;
import com.Votify.backend.model.VotoMO;

public class EmitirVotoMulticriterioCommand implements VotifyCommand<VotoMO> {
    private final VotoFacade votoFacade;
    private final EmitirEvaluacionRequest request;

    public EmitirVotoMulticriterioCommand(VotoFacade votoFacade, EmitirEvaluacionRequest request) {
        this.votoFacade = votoFacade;
        this.request = request;
    }

    @Override
    public VotoMO execute() {
        return votoFacade.votarMulticriterio(request);
    }
}