package com.Votify.backend.chainOfResponsability;

import com.Votify.backend.dto.VotoRequest;

public abstract class ValidadorVotoBase implements ValidadorVoto {
    protected ValidadorVoto siguiente;
    
    @Override
    public void setSiguiente(ValidadorVoto siguiente) {
        this.siguiente = siguiente;
    }
    
    @Override
    public ValidadorVoto siguiente() {
        return siguiente;
    }
    
    @Override
    public void validar(VotoRequest request) {
        ejecutarValidacion(request);
        if (siguiente != null) {
            siguiente.validar(request);
        }
    }
    
    protected abstract void ejecutarValidacion(VotoRequest request);
}
