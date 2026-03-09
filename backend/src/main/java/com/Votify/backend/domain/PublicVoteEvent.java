package com.Votify.backend.domain;

public class PublicVoteEvent extends Event { // concrete product

    @Override
    public String tipoEvento() {
        return "PUBLICO";
    }
}