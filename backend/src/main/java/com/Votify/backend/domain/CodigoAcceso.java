package com.Votify.backend.domain;

public abstract class CodigoAcceso { //abstract product

    protected String valor;

    public String getValor() {
        return valor;
    }

    public abstract String tipo();
}
