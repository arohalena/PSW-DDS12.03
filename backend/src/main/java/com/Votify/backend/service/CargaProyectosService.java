package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.Votify.backend.dto.CargaProyectosRestResponse;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.ports.CargaProyectosRestPort;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@AllArgsConstructor
public class CargaProyectosService implements CargaProyectosRestPort {

	@Autowired
	public ProyectoRepository repositoryProyecto;


	@Override
	@Transactional(rollbackFor = Exception.class)
	public CargaProyectosRestResponse cargaProyectos(UUID eventoId) throws Exception {

		try {
			List<ProyectoMO> proyectos = repositoryProyecto.findByEvento_Id(eventoId);

			if (proyectos.isEmpty()) {
				return new CargaProyectosRestResponse("No existen proyectos para el evento " + eventoId, null);
			} else {
				return new CargaProyectosRestResponse("Operacion finalizada correctamente ", proyectos);
			}

		} catch (Exception e) {
			return new CargaProyectosRestResponse("Operacion finalizada con errores: " + e.getMessage(), null);
		}
	}

}

