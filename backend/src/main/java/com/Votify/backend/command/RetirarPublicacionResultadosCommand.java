package com.Votify.backend.command;

import java.util.UUID;

import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.service.VotacionService;

public class RetirarPublicacionResultadosCommand implements VotifyCommand<VotacionMO> {
    private final VotacionService votacionService;
    private final UUID votacionId;

    public RetirarPublicacionResultadosCommand(VotacionService votacionService, UUID votacionId) {
        this.votacionService = votacionService;
        this.votacionId = votacionId;
    }

    @Override
    public VotacionMO execute() {
        return votacionService.retirarPublicacionResultados(votacionId);
    }
}
