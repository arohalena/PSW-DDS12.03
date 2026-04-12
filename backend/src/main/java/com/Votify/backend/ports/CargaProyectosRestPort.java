package com.Votify.backend.ports;

import java.util.UUID;

import com.Votify.backend.dto.CargaProyectosRestResponse;

public interface CargaProyectosRestPort {
	CargaProyectosRestResponse cargaProyectos(UUID eventoId) throws Exception;
}
