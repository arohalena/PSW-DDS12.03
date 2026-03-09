package com.Votify.backend.domain;

public class MixedEvent extends Event { // concrete product

    @Override
    public String tipoEvento() {
        return "MIXTO";
    }
}