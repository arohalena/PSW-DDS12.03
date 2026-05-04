package com.Votify.backend.dto;

import java.util.UUID;

import com.Votify.backend.model.ModoRankingMO;

public record CambiarModoRankingRequest(
    UUID usuarioId,
    ModoRankingMO modo
) {}