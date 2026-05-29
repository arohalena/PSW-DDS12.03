package com.Votify.backend.command;

import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.facade.VotoFacade;
import com.Votify.backend.model.VotoMO;

public class EmitirVotoSimpleCommand implements VotifyCommand<VotoMO> {
    private final VotoFacade votoFacade;
    private final EmitirVotoSimpleRequest request;

    public EmitirVotoSimpleCommand(VotoFacade votoFacade, EmitirVotoSimpleRequest request) {
        this.votoFacade = votoFacade;
        this.request = request;
    }

    @Override
    public VotoMO execute() {
        return votoFacade.votarSimple(request);
    }
}
