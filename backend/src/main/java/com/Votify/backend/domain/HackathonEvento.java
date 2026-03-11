package com.Votify.backend.domain;

<<<<<<< HEAD
import com.Votify.backend.model.TipoEventoMO;
=======
import java.time.OffsetDateTime;

import com.Votify.backend.model.TipoEvento;
>>>>>>> traerCambios

public class HackathonEvento extends Evento {
    
    public HackathonEvento(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin) {

        super(nombre, descripcion, codigoAccesoPublico, fecha_inicio, fecha_fin);

    }

    @Override
    public TipoEventoMO tipo(){
        
        return TipoEventoMO.HACKATHON;

    }
}
