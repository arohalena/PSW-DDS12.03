package com.Votify.backend.domain;

<<<<<<< HEAD
import com.Votify.backend.model.TipoEventoMO;
=======
import com.Votify.backend.model.TipoEvento;
import java.time.OffsetDateTime;
>>>>>>> traerCambios

public class FeriaInovacionEvento extends Evento {
    
    public FeriaInovacionEvento(String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin){

        super(nombre, descripcion, codigoAccesoPublico, fecha_inicio, fecha_fin);

    }

    @Override
    public TipoEventoMO tipo(){

        return TipoEventoMO.FERIA_INOVACION;
        
    }
}
