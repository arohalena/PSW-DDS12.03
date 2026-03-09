package com.Votify.backend.domain;

public class CodigoAccesoSimple extends CodigoAcceso { // concrete product

    public CodigoAccesoSimple(String valor) {
        this.valor = valor;
    }

    @Override
    public String tipo(){
        return "SIMPLE";
    }
}