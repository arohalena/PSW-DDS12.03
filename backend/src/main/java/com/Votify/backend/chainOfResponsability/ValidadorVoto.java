package com.Votify.backend.chainOfResponsability;

import com.Votify.backend.dto.VotoRequest;

public interface ValidadorVoto {
    void validar(VotoRequest request);
    
    ValidadorVoto siguiente();
    void setSiguiente(ValidadorVoto siguiente);
}
