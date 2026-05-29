package com.Votify.backend.command;

import java.util.UUID;

import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.service.VotacionService;

public class PublicarResultadosCommand implements VotifyCommand<VotacionMO> {
    private final VotacionService votacionService;
    private final UUID votacionId;

    public PublicarResultadosCommand(VotacionService votacionService, UUID votacionId) {
        this.votacionService = votacionService;
        this.votacionId = votacionId;
    }

    @Override
    public VotacionMO execute() {
        return votacionService.publicarResultados(votacionId);
    }
}

