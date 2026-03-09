package com.Votify.backend.domain;

public class JuryVoteEvent extends Event { // concrete product

    @Override
    public String tipoEvento() {
        return "JURADO";
    }
}