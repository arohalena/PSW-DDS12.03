package com.Votify.backend.factory.codigo;

import com.Votify.backend.dto.EventoDTO;

public class CodigoAccesoFactorySelector {

    public static CodigoAccesoCreator getCreator(EventoDTO dto) {

        // In futuro:
        // switch(dto.getTipoEvento()):
        //   case "PREMIUM" -> new CodigoAccesoPremiumCreator()
        //   case "LARGO"   -> new CodigoAccesoLargoCreator()

        return new CodigoAccesoSimpleCreator();
    }
}