package com.Votify.backend.command;

import com.Votify.backend.dto.EmitirVotoPuntosRequest;
import com.Votify.backend.facade.VotoFacade;
import com.Votify.backend.model.VotoMO;

public class EmitirVotoPuntosCommand implements VotifyCommand<VotoMO> {
    private final VotoFacade votoFacade;
    private final EmitirVotoPuntosRequest request;

    public EmitirVotoPuntosCommand(VotoFacade votoFacade, EmitirVotoPuntosRequest request) {
        this.votoFacade = votoFacade;
        this.request = request;
    }

    @Override
    public VotoMO execute() {
        return votoFacade.votarPuntos(request);
    }
}
